package v0alpha1

import (
	common "k8s.io/kube-openapi/pkg/common"
	spec "k8s.io/kube-openapi/pkg/validation/spec"
)

func GetOpenAPIDefinitions(ref common.ReferenceCallback) map[string]common.OpenAPIDefinition {
	return map[string]common.OpenAPIDefinition{
		Organization{}.OpenAPIModelName():      schemaOrganization(ref),
		OrganizationList{}.OpenAPIModelName():  schemaOrganizationList(ref),
		OrganizationSpec{}.OpenAPIModelName():  schemaOrganizationSpec(),
		OrgMembership{}.OpenAPIModelName():     schemaOrgMembership(ref),
		OrgMembershipList{}.OpenAPIModelName(): schemaOrgMembershipList(ref),
		OrgMembershipSpec{}.OpenAPIModelName(): schemaOrgMembershipSpec(),
	}
}

func schemaOrganization(ref common.ReferenceCallback) common.OpenAPIDefinition {
	return common.OpenAPIDefinition{
		Schema: spec.Schema{SchemaProps: spec.SchemaProps{
			Type: []string{"object"},
			Properties: map[string]spec.Schema{
				"kind":       {SchemaProps: spec.SchemaProps{Type: []string{"string"}}},
				"apiVersion": {SchemaProps: spec.SchemaProps{Type: []string{"string"}}},
				"metadata":   {SchemaProps: spec.SchemaProps{Ref: ref("io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta")}},
				"spec":       {SchemaProps: spec.SchemaProps{Ref: ref(OrganizationSpec{}.OpenAPIModelName())}},
			},
		}},
		Dependencies: []string{OrganizationSpec{}.OpenAPIModelName(), "io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta"},
	}
}

func schemaOrganizationList(ref common.ReferenceCallback) common.OpenAPIDefinition {
	return common.OpenAPIDefinition{
		Schema: spec.Schema{SchemaProps: spec.SchemaProps{
			Type: []string{"object"},
			Properties: map[string]spec.Schema{
				"kind":       {SchemaProps: spec.SchemaProps{Type: []string{"string"}}},
				"apiVersion": {SchemaProps: spec.SchemaProps{Type: []string{"string"}}},
				"metadata":   {SchemaProps: spec.SchemaProps{Ref: ref("io.k8s.apimachinery.pkg.apis.meta.v1.ListMeta")}},
				"items": {SchemaProps: spec.SchemaProps{
					Type:  []string{"array"},
					Items: &spec.SchemaOrArray{Schema: &spec.Schema{SchemaProps: spec.SchemaProps{Ref: ref(Organization{}.OpenAPIModelName())}}},
				}},
			},
			Required: []string{"items"},
		}},
		Dependencies: []string{Organization{}.OpenAPIModelName(), "io.k8s.apimachinery.pkg.apis.meta.v1.ListMeta"},
	}
}

func schemaOrganizationSpec() common.OpenAPIDefinition {
	return common.OpenAPIDefinition{
		Schema: spec.Schema{SchemaProps: spec.SchemaProps{
			Type: []string{"object"},
			Properties: map[string]spec.Schema{
				"name":     {SchemaProps: spec.SchemaProps{Type: []string{"string"}}},
				"address1": {SchemaProps: spec.SchemaProps{Type: []string{"string"}}},
				"address2": {SchemaProps: spec.SchemaProps{Type: []string{"string"}}},
				"city":     {SchemaProps: spec.SchemaProps{Type: []string{"string"}}},
				"zipCode":  {SchemaProps: spec.SchemaProps{Type: []string{"string"}}},
				"state":    {SchemaProps: spec.SchemaProps{Type: []string{"string"}}},
				"country":  {SchemaProps: spec.SchemaProps{Type: []string{"string"}}},
			},
			Required: []string{"name"},
		}},
	}
}

func schemaOrgMembership(ref common.ReferenceCallback) common.OpenAPIDefinition {
	return common.OpenAPIDefinition{
		Schema: spec.Schema{SchemaProps: spec.SchemaProps{
			Type: []string{"object"},
			Properties: map[string]spec.Schema{
				"kind":       {SchemaProps: spec.SchemaProps{Type: []string{"string"}}},
				"apiVersion": {SchemaProps: spec.SchemaProps{Type: []string{"string"}}},
				"metadata":   {SchemaProps: spec.SchemaProps{Ref: ref("io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta")}},
				"spec":       {SchemaProps: spec.SchemaProps{Ref: ref(OrgMembershipSpec{}.OpenAPIModelName())}},
			},
		}},
		Dependencies: []string{OrgMembershipSpec{}.OpenAPIModelName(), "io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta"},
	}
}

func schemaOrgMembershipList(ref common.ReferenceCallback) common.OpenAPIDefinition {
	return common.OpenAPIDefinition{
		Schema: spec.Schema{SchemaProps: spec.SchemaProps{
			Type: []string{"object"},
			Properties: map[string]spec.Schema{
				"kind":       {SchemaProps: spec.SchemaProps{Type: []string{"string"}}},
				"apiVersion": {SchemaProps: spec.SchemaProps{Type: []string{"string"}}},
				"metadata":   {SchemaProps: spec.SchemaProps{Ref: ref("io.k8s.apimachinery.pkg.apis.meta.v1.ListMeta")}},
				"items": {SchemaProps: spec.SchemaProps{
					Type:  []string{"array"},
					Items: &spec.SchemaOrArray{Schema: &spec.Schema{SchemaProps: spec.SchemaProps{Ref: ref(OrgMembership{}.OpenAPIModelName())}}},
				}},
			},
			Required: []string{"items"},
		}},
		Dependencies: []string{OrgMembership{}.OpenAPIModelName(), "io.k8s.apimachinery.pkg.apis.meta.v1.ListMeta"},
	}
}

func schemaOrgMembershipSpec() common.OpenAPIDefinition {
	return common.OpenAPIDefinition{
		Schema: spec.Schema{SchemaProps: spec.SchemaProps{
			Type: []string{"object"},
			Properties: map[string]spec.Schema{
				"orgRef":  {SchemaProps: spec.SchemaProps{Type: []string{"string"}}},
				"userRef": {SchemaProps: spec.SchemaProps{Type: []string{"string"}}},
				"role":    {SchemaProps: spec.SchemaProps{Type: []string{"string"}}},
				"orgName": {SchemaProps: spec.SchemaProps{Type: []string{"string"}}},
			},
			Required: []string{"orgRef", "userRef", "role"},
		}},
	}
}
