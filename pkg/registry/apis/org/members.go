package org

import (
	"context"
	"errors"
	"fmt"
	"strconv"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metainternalversion "k8s.io/apimachinery/pkg/apis/meta/internalversion"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/selection"
	"k8s.io/apiserver/pkg/registry/rest"

	orgv0 "github.com/grafana/grafana/pkg/apis/org/v0alpha1"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/user"
)

var (
	_ rest.Storage              = (*membershipStorage)(nil)
	_ rest.Scoper               = (*membershipStorage)(nil)
	_ rest.SingularNameProvider = (*membershipStorage)(nil)
	_ rest.KindProvider         = (*membershipStorage)(nil)
	_ rest.Getter               = (*membershipStorage)(nil)
	_ rest.Lister               = (*membershipStorage)(nil)
	_ rest.Creater              = (*membershipStorage)(nil)
	_ rest.Updater              = (*membershipStorage)(nil)
	_ rest.GracefulDeleter      = (*membershipStorage)(nil)
	_ rest.TableConvertor       = (*membershipStorage)(nil)
)

type membershipStorage struct {
	orgs  org.Service
	users user.Service
}

func newMembershipStorage(orgs org.Service, users user.Service) *membershipStorage {
	return &membershipStorage{orgs: orgs, users: users}
}

func (s *membershipStorage) New() runtime.Object { return &orgv0.OrgMembership{} }

func (s *membershipStorage) Destroy() {}

func (s *membershipStorage) NamespaceScoped() bool { return false }

func (s *membershipStorage) GetSingularName() string { return "orgmembership" }

func (s *membershipStorage) Kind() string { return "OrgMembership" }

func (s *membershipStorage) NewList() runtime.Object { return &orgv0.OrgMembershipList{} }

func (s *membershipStorage) ConvertToTable(ctx context.Context, object runtime.Object, tableOptions runtime.Object) (*metav1.Table, error) {
	return rest.NewDefaultTableConvertor(orgv0.OrgMembershipResourceInfo.GroupResource()).ConvertToTable(ctx, object, tableOptions)
}

func (s *membershipStorage) Get(ctx context.Context, name string, _ *metav1.GetOptions) (runtime.Object, error) {
	orgID, userRef, err := parseMembershipName(name)
	if err != nil {
		return nil, apierrors.NewBadRequest(err.Error())
	}
	member, err := s.lookupMember(ctx, orgID, userRef)
	if err != nil {
		return nil, err
	}
	return member, nil
}

func (s *membershipStorage) List(ctx context.Context, options *metainternalversion.ListOptions) (runtime.Object, error) {
	orgID, userRef := selectorsFromList(options)
	list := &orgv0.OrgMembershipList{
		TypeMeta: metav1.TypeMeta{Kind: "OrgMembershipList", APIVersion: orgv0.APIVERSION},
	}

	if orgID == 0 && userRef != "" {
		u, err := s.resolveUser(ctx, userRef)
		if err != nil {
			return nil, err
		}
		orgs, err := s.orgs.GetUserOrgList(ctx, &org.GetUserOrgListQuery{UserID: u.ID})
		if err != nil {
			return nil, err
		}
		for _, o := range orgs {
			list.Items = append(list.Items, orgv0.OrgMembership{
				TypeMeta:   metav1.TypeMeta{Kind: "OrgMembership", APIVersion: orgv0.APIVERSION},
				ObjectMeta: metav1.ObjectMeta{Name: membershipName(o.OrgID, userRef)},
				Spec: orgv0.OrgMembershipSpec{
					OrgRef:  strconv.FormatInt(o.OrgID, 10),
					UserRef: userRef,
					Role:    string(o.Role),
				},
			})
		}
		return list, nil
	}

	if orgID == 0 {
		return nil, apierrors.NewBadRequest("list orgmemberships requires fieldSelector spec.orgRef=<id> or spec.userRef=<uid>")
	}

	result, err := s.orgs.SearchOrgUsers(ctx, &org.SearchOrgUsersQuery{
		OrgID: orgID,
		Query: userRef,
		Limit: 1000,
		Page:  1,
	})
	if err != nil {
		return nil, err
	}
	if result == nil {
		return list, nil
	}
	for _, dto := range result.OrgUsers {
		if res := orgUserToMembership(dto); res != nil {
			if userRef != "" && res.Spec.UserRef != userRef && strconv.FormatInt(dto.UserID, 10) != userRef {
				continue
			}
			list.Items = append(list.Items, *res)
		}
	}
	return list, nil
}

func (s *membershipStorage) Create(ctx context.Context, obj runtime.Object, _ rest.ValidateObjectFunc, _ *metav1.CreateOptions) (runtime.Object, error) {
	m, ok := obj.(*orgv0.OrgMembership)
	if !ok {
		return nil, fmt.Errorf("expected OrgMembership")
	}
	if err := validateMembershipSpec(m.Spec); err != nil {
		return nil, apierrors.NewBadRequest(err.Error())
	}
	orgID, err := parseOrgID(m.Spec.OrgRef)
	if err != nil {
		return nil, apierrors.NewBadRequest(err.Error())
	}
	u, err := s.resolveUser(ctx, m.Spec.UserRef)
	if err != nil {
		return nil, err
	}
	if err := s.orgs.AddOrgUser(ctx, &org.AddOrgUserCommand{
		LoginOrEmail: firstNonEmpty(u.Login, u.Email),
		Role:         org.RoleType(m.Spec.Role),
		OrgID:        orgID,
		UserID:       u.ID,
	}); err != nil {
		return nil, mapMembershipError(err, m.Name)
	}
	if m.Name == "" {
		m.Name = membershipName(orgID, m.Spec.UserRef)
	}
	return s.Get(ctx, m.Name, &metav1.GetOptions{})
}

func (s *membershipStorage) Update(ctx context.Context, name string, objInfo rest.UpdatedObjectInfo, _ rest.ValidateObjectFunc, _ rest.ValidateObjectUpdateFunc, _ bool, _ *metav1.UpdateOptions) (runtime.Object, bool, error) {
	old, err := s.Get(ctx, name, &metav1.GetOptions{})
	if err != nil {
		return nil, false, err
	}
	obj, err := objInfo.UpdatedObject(ctx, old)
	if err != nil {
		return nil, false, err
	}
	m, ok := obj.(*orgv0.OrgMembership)
	if !ok {
		return nil, false, fmt.Errorf("expected OrgMembership")
	}
	orgID, userRef, err := parseMembershipName(name)
	if err != nil {
		return nil, false, apierrors.NewBadRequest(err.Error())
	}
	u, err := s.resolveUser(ctx, userRef)
	if err != nil {
		return nil, false, err
	}
	if err := s.orgs.UpdateOrgUser(ctx, &org.UpdateOrgUserCommand{
		Role:   org.RoleType(m.Spec.Role),
		OrgID:  orgID,
		UserID: u.ID,
	}); err != nil {
		return nil, false, mapMembershipError(err, name)
	}
	updated, err := s.Get(ctx, name, &metav1.GetOptions{})
	return updated, false, err
}

func (s *membershipStorage) Delete(ctx context.Context, name string, _ rest.ValidateObjectFunc, _ *metav1.DeleteOptions) (runtime.Object, bool, error) {
	orgID, userRef, err := parseMembershipName(name)
	if err != nil {
		return nil, false, apierrors.NewBadRequest(err.Error())
	}
	u, err := s.resolveUser(ctx, userRef)
	if err != nil {
		return nil, false, err
	}
	if err := s.orgs.RemoveOrgUser(ctx, &org.RemoveOrgUserCommand{
		UserID: u.ID,
		OrgID:  orgID,
	}); err != nil {
		return nil, false, mapMembershipError(err, name)
	}
	return &metav1.Status{Status: metav1.StatusSuccess}, true, nil
}

func (s *membershipStorage) lookupMember(ctx context.Context, orgID int64, userRef string) (*orgv0.OrgMembership, error) {
	u, err := s.resolveUser(ctx, userRef)
	if err != nil {
		return nil, err
	}
	result, err := s.orgs.SearchOrgUsers(ctx, &org.SearchOrgUsersQuery{
		OrgID:  orgID,
		UserID: u.ID,
		Limit:  1,
		Page:   1,
	})
	if err != nil {
		return nil, err
	}
	if result == nil || len(result.OrgUsers) == 0 {
		return nil, orgv0.OrgMembershipResourceInfo.NewNotFound(membershipName(orgID, userRef))
	}
	return orgUserToMembership(result.OrgUsers[0]), nil
}

func (s *membershipStorage) resolveUser(ctx context.Context, ref string) (*user.User, error) {
	if s.users == nil {
		return nil, apierrors.NewInternalError(fmt.Errorf("user service is not configured"))
	}
	u, err := s.users.GetByUID(ctx, &user.GetUserByUIDQuery{UID: ref})
	if err == nil {
		return u, nil
	}
	if id, parseErr := strconv.ParseInt(ref, 10, 64); parseErr == nil {
		u, err = s.users.GetByID(ctx, &user.GetUserByIDQuery{ID: id})
		if err == nil {
			return u, nil
		}
	}
	if errors.Is(err, user.ErrUserNotFound) {
		return nil, apierrors.NewNotFound(orgv0.OrgMembershipResourceInfo.GroupResource(), ref)
	}
	return nil, err
}

func selectorsFromList(options *metainternalversion.ListOptions) (orgID int64, userRef string) {
	if options == nil || options.FieldSelector == nil || options.FieldSelector.Empty() {
		return 0, ""
	}
	requirements := options.FieldSelector.Requirements()
	for _, req := range requirements {
		if req.Operator != selection.Equals {
			continue
		}
		switch req.Field {
		case "spec.orgRef":
			orgID, _ = strconv.ParseInt(req.Value, 10, 64)
		case "spec.userRef":
			userRef = req.Value
		}
	}
	return orgID, userRef
}

func validateMembershipSpec(spec orgv0.OrgMembershipSpec) error {
	if spec.OrgRef == "" || spec.UserRef == "" {
		return fmt.Errorf("spec.orgRef and spec.userRef are required")
	}
	switch spec.Role {
	case string(org.RoleNone), string(org.RoleViewer), string(org.RoleEditor), string(org.RoleAdmin):
		return nil
	default:
		return fmt.Errorf("spec.role must be None, Viewer, Editor, or Admin")
	}
}

func mapMembershipError(err error, name string) error {
	switch {
	case errors.Is(err, org.ErrOrgUserAlreadyAdded):
		return apierrors.NewAlreadyExists(orgv0.OrgMembershipResourceInfo.GroupResource(), name)
	case errors.Is(err, org.ErrOrgUserNotFound):
		return orgv0.OrgMembershipResourceInfo.NewNotFound(name)
	case errors.Is(err, org.ErrLastOrgAdmin):
		return apierrors.NewBadRequest(err.Error())
	case errors.Is(err, org.ErrCannotChangeRoleForExternallySyncedUser):
		return apierrors.NewForbidden(orgv0.OrgMembershipResourceInfo.GroupResource(), name, err)
	default:
		return err
	}
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}
