package v0alpha1

import runtime "k8s.io/apimachinery/pkg/runtime"

func (in *UserOrg) DeepCopyInto(out *UserOrg) {
	*out = *in
}

func (in *UserOrg) DeepCopy() *UserOrg {
	if in == nil {
		return nil
	}
	out := new(UserOrg)
	in.DeepCopyInto(out)
	return out
}

func (in *UserOrgList) DeepCopyInto(out *UserOrgList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		in, out := &in.Items, &out.Items
		*out = make([]UserOrg, len(*in))
		copy(*out, *in)
	}
}

func (in *UserOrgList) DeepCopy() *UserOrgList {
	if in == nil {
		return nil
	}
	out := new(UserOrgList)
	in.DeepCopyInto(out)
	return out
}

func (in *UserOrgList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

func (in *UserAuthToken) DeepCopyInto(out *UserAuthToken) {
	*out = *in
}

func (in *UserAuthToken) DeepCopy() *UserAuthToken {
	if in == nil {
		return nil
	}
	out := new(UserAuthToken)
	in.DeepCopyInto(out)
	return out
}

func (in *UserAuthTokenList) DeepCopyInto(out *UserAuthTokenList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		in, out := &in.Items, &out.Items
		*out = make([]UserAuthToken, len(*in))
		copy(*out, *in)
	}
}

func (in *UserAuthTokenList) DeepCopy() *UserAuthTokenList {
	if in == nil {
		return nil
	}
	out := new(UserAuthTokenList)
	in.DeepCopyInto(out)
	return out
}

func (in *UserAuthTokenList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

func (in *UserAuthTokenRevokeStatus) DeepCopyInto(out *UserAuthTokenRevokeStatus) {
	*out = *in
	out.TypeMeta = in.TypeMeta
}

func (in *UserAuthTokenRevokeStatus) DeepCopy() *UserAuthTokenRevokeStatus {
	if in == nil {
		return nil
	}
	out := new(UserAuthTokenRevokeStatus)
	in.DeepCopyInto(out)
	return out
}

func (in *UserAuthTokenRevokeStatus) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

func (in *UserUsingStatus) DeepCopyInto(out *UserUsingStatus) {
	*out = *in
	out.TypeMeta = in.TypeMeta
}

func (in *UserUsingStatus) DeepCopy() *UserUsingStatus {
	if in == nil {
		return nil
	}
	out := new(UserUsingStatus)
	in.DeepCopyInto(out)
	return out
}

func (in *UserUsingStatus) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

func (in *UserPasswordStatus) DeepCopyInto(out *UserPasswordStatus) {
	*out = *in
	out.TypeMeta = in.TypeMeta
}

func (in *UserPasswordStatus) DeepCopy() *UserPasswordStatus {
	if in == nil {
		return nil
	}
	out := new(UserPasswordStatus)
	in.DeepCopyInto(out)
	return out
}

func (in *UserPasswordStatus) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}
