import { Department } from "@/app/types/strapi-entities"
import { EntityMetadata, findEntity, StrapiFindParams, strapiRequest } from ".."
import { data } from "react-router"

export const DEPARTMENT_ENTITY_METADATA: EntityMetadata = {
	plural: "departments",
	singular: "department",
	modelRefName: "api::department.department"
}

const DEPARTMENTS = DEPARTMENT_ENTITY_METADATA.plural

export const getAllDepartments = async () => 
	strapiRequest<Department[]>(DEPARTMENTS, "find")
  
export const getDepartmentById = async (documentId: string) => {
	const response = await strapiRequest<{ data: Department[] }> (DEPARTMENTS, "find", {
		params: {
			filters: {
				documentId: {
					$eq: documentId
				}
			},
			populate: ["materials", "tools"]
		}
	})
	// console.log("Consultando departamento con documentId:", documentId);
	// console.log("Respuesta completa:", JSON.stringify(response, null, 2));

	return {
		data: response.data?.[0],
		error: response.error
	}
}


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
