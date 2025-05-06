import { Department } from "@/app/types/strapi-entities"
import { EntityMetadata, findEntity, StrapiFindParams, strapiRequest } from ".."

export const DEPARTMENT_ENTITY_METADATA: EntityMetadata = {
	plural: "departments",
	singular: "department",
	modelRefName: "api::department.department"
}

const DEPARTMENTS = DEPARTMENT_ENTITY_METADATA.plural

export const getAllDepartments = () =>
	strapiRequest<Department[]>(DEPARTMENTS, "find" , {
		params: { populate: "*" }
		
	});

export const getDepartmentById = (documentId: string) =>
	strapiRequest<Department>(DEPARTMENTS, "findOne", { documentId })

export const createDepartment = (data: Partial<Department>) => {
	return strapiRequest<Department>(DEPARTMENTS, "create", {
		data,
		params: { populate: "*" }
	})
}

export const updateDepartment = (
	documentId: string,
	data: Partial<Department>
) => {
	return strapiRequest<Department>(DEPARTMENTS, "update", {
		documentId,
		data,
		params: {
			populate: "*"
		}
	})
}

export const deleteDepartment = (documentId: string) =>
	strapiRequest(DEPARTMENTS, "delete", { documentId })

export const getGroupBy = (params: StrapiFindParams) =>
	findEntity<Department>(DEPARTMENTS, params)
