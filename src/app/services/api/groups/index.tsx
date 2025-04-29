import { Group } from "@/app/types/strapi-entities"
import { EntityMetadata, findEntity, StrapiFindParams, strapiRequest } from ".."

export const GROUP_ENTITY_METADATA: EntityMetadata = {
	plural: "groups",
	singular: "group",
	modelRefName: "api::group.group"
}

const GROUPS = GROUP_ENTITY_METADATA.plural

export const getAllGroups = () => strapiRequest<Group[]>(GROUPS, "find")

export const getGroupById = (documentId: string) =>
	strapiRequest<Group>(GROUPS, "findOne", { documentId })

export const createGroup = (data: Partial<Group>) => {
	return strapiRequest<Group>(GROUPS, "create", {
		data,
		params: { populate: "*" }
	})
}

export const updateGroup = (documentId: string, data: Partial<Group>) => {
	return strapiRequest<Group>(GROUPS, "update", {
		documentId,
		data,
		params: {
			populate: "*"
		}
	})
}

export const deleteGroup = (documentId: string) =>
	strapiRequest(GROUPS, "delete", { documentId })

export const getGroupBy = (params: StrapiFindParams) =>
	findEntity<Group>(GROUPS, params)
