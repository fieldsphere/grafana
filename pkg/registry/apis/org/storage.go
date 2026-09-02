package org

import (
	"context"
	"errors"
	"fmt"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metainternalversion "k8s.io/apimachinery/pkg/apis/meta/internalversion"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apiserver/pkg/registry/rest"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	orgv0 "github.com/grafana/grafana/pkg/apis/org/v0alpha1"
	"github.com/grafana/grafana/pkg/services/org"
)

var (
	_ rest.Storage              = (*orgStorage)(nil)
	_ rest.Scoper               = (*orgStorage)(nil)
	_ rest.SingularNameProvider = (*orgStorage)(nil)
	_ rest.KindProvider         = (*orgStorage)(nil)
	_ rest.Getter               = (*orgStorage)(nil)
	_ rest.Lister               = (*orgStorage)(nil)
	_ rest.Creater              = (*orgStorage)(nil)
	_ rest.Updater              = (*orgStorage)(nil)
	_ rest.GracefulDeleter      = (*orgStorage)(nil)
	_ rest.TableConvertor       = (*orgStorage)(nil)
)

type orgStorage struct {
	service org.Service
	deleter org.DeletionService
}

func newOrgStorage(service org.Service, deleter org.DeletionService) *orgStorage {
	return &orgStorage{service: service, deleter: deleter}
}

func (s *orgStorage) New() runtime.Object { return &orgv0.Organization{} }

func (s *orgStorage) Destroy() {}

func (s *orgStorage) NamespaceScoped() bool { return false }

func (s *orgStorage) GetSingularName() string { return "organization" }

func (s *orgStorage) Kind() string { return "Organization" }

func (s *orgStorage) NewList() runtime.Object { return &orgv0.OrganizationList{} }

func (s *orgStorage) ConvertToTable(ctx context.Context, object runtime.Object, tableOptions runtime.Object) (*metav1.Table, error) {
	return rest.NewDefaultTableConvertor(orgv0.OrganizationResourceInfo.GroupResource()).ConvertToTable(ctx, object, tableOptions)
}

func (s *orgStorage) Get(ctx context.Context, name string, _ *metav1.GetOptions) (runtime.Object, error) {
	id, err := parseOrgID(name)
	if err != nil {
		return nil, apierrors.NewBadRequest(err.Error())
	}
	o, err := s.service.GetByID(ctx, &org.GetOrgByIDQuery{ID: id})
	if err != nil {
		if errors.Is(err, org.ErrOrgNotFound) {
			return nil, orgv0.OrganizationResourceInfo.NewNotFound(name)
		}
		return nil, err
	}
	return orgToResource(o), nil
}

func (s *orgStorage) List(ctx context.Context, options *metainternalversion.ListOptions) (runtime.Object, error) {
	limit := 1000
	if options != nil && options.Limit > 0 {
		limit = int(options.Limit)
	}
	orgs, err := s.service.Search(ctx, &org.SearchOrgsQuery{Limit: limit})
	if err != nil {
		return nil, err
	}
	list := &orgv0.OrganizationList{
		TypeMeta: metav1.TypeMeta{Kind: "OrganizationList", APIVersion: orgv0.APIVERSION},
		Items:    make([]orgv0.Organization, 0, len(orgs)),
	}
	for _, o := range orgs {
		if res := orgDTOToResource(o); res != nil {
			list.Items = append(list.Items, *res)
		}
	}
	return list, nil
}

func (s *orgStorage) Create(ctx context.Context, obj runtime.Object, _ rest.ValidateObjectFunc, _ *metav1.CreateOptions) (runtime.Object, error) {
	o, ok := obj.(*orgv0.Organization)
	if !ok {
		return nil, fmt.Errorf("expected Organization")
	}
	if o.Spec.Name == "" {
		return nil, apierrors.NewBadRequest("spec.name is required")
	}

	requester, err := identity.GetRequester(ctx)
	if err != nil {
		return nil, apierrors.NewUnauthorized("valid user is required")
	}
	userID, err := identity.UserIdentifier(requester.GetID())
	if err != nil {
		return nil, apierrors.NewBadRequest("only users can create organizations")
	}

	created, err := s.service.CreateWithMember(ctx, &org.CreateOrgCommand{
		Name:   o.Spec.Name,
		UserID: userID,
	})
	if err != nil {
		if errors.Is(err, org.ErrOrgNameTaken) {
			return nil, apierrors.NewAlreadyExists(orgv0.OrganizationResourceInfo.GroupResource(), o.Spec.Name)
		}
		return nil, err
	}

	if hasAddress(o.Spec) {
		_ = s.service.UpdateAddress(ctx, &org.UpdateOrgAddressCommand{
			OrgID: created.ID,
			Address: org.Address{
				Address1: o.Spec.Address1,
				Address2: o.Spec.Address2,
				City:     o.Spec.City,
				ZipCode:  o.Spec.ZipCode,
				State:    o.Spec.State,
				Country:  o.Spec.Country,
			},
		})
		created, err = s.service.GetByID(ctx, &org.GetOrgByIDQuery{ID: created.ID})
		if err != nil {
			return nil, err
		}
	}
	return orgToResource(created), nil
}

func (s *orgStorage) Update(ctx context.Context, name string, objInfo rest.UpdatedObjectInfo, _ rest.ValidateObjectFunc, _ rest.ValidateObjectUpdateFunc, _ bool, _ *metav1.UpdateOptions) (runtime.Object, bool, error) {
	old, err := s.Get(ctx, name, &metav1.GetOptions{})
	if err != nil {
		return nil, false, err
	}
	obj, err := objInfo.UpdatedObject(ctx, old)
	if err != nil {
		return nil, false, err
	}
	o, ok := obj.(*orgv0.Organization)
	if !ok {
		return nil, false, fmt.Errorf("expected Organization")
	}
	id, err := parseOrgID(name)
	if err != nil {
		return nil, false, apierrors.NewBadRequest(err.Error())
	}
	if o.Spec.Name != "" {
		if err := s.service.UpdateOrg(ctx, &org.UpdateOrgCommand{Name: o.Spec.Name, OrgId: id}); err != nil {
			if errors.Is(err, org.ErrOrgNameTaken) {
				return nil, false, apierrors.NewBadRequest("organization name taken")
			}
			return nil, false, err
		}
	}
	if err := s.service.UpdateAddress(ctx, &org.UpdateOrgAddressCommand{
		OrgID: id,
		Address: org.Address{
			Address1: o.Spec.Address1,
			Address2: o.Spec.Address2,
			City:     o.Spec.City,
			ZipCode:  o.Spec.ZipCode,
			State:    o.Spec.State,
			Country:  o.Spec.Country,
		},
	}); err != nil {
		return nil, false, err
	}
	updated, err := s.Get(ctx, name, &metav1.GetOptions{})
	return updated, false, err
}

func (s *orgStorage) Delete(ctx context.Context, name string, _ rest.ValidateObjectFunc, _ *metav1.DeleteOptions) (runtime.Object, bool, error) {
	id, err := parseOrgID(name)
	if err != nil {
		return nil, false, apierrors.NewBadRequest(err.Error())
	}
	if s.deleter == nil {
		return nil, false, apierrors.NewInternalError(fmt.Errorf("organization deletion is not configured"))
	}
	if err := s.deleter.Delete(ctx, &org.DeleteOrgCommand{ID: id}); err != nil {
		if errors.Is(err, org.ErrOrgNotFound) {
			return nil, false, orgv0.OrganizationResourceInfo.NewNotFound(name)
		}
		return nil, false, err
	}
	return &metav1.Status{Status: metav1.StatusSuccess}, true, nil
}

func hasAddress(spec orgv0.OrganizationSpec) bool {
	return spec.Address1 != "" || spec.Address2 != "" || spec.City != "" || spec.ZipCode != "" || spec.State != "" || spec.Country != ""
}
