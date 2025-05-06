import { Group, User} from "@app/types/strapi-entities"
import {
	ApiResponse,
	EntityMetadata,
	findEntity,
	MediaFieldDescriptor,
	RelationAction,
	StrapiFindParams,
	strapiRequest
} from ".."

export const USER_ENTITY_METADATA: EntityMetadata = {
	plural: "users",
	singular: "user",
	modelRefName: "api::user.user"
}

const USERS = USER_ENTITY_METADATA.plural

export const getAllUsers = () => strapiRequest<User[]>(USERS, "find")

export const getUserById = (documentId: string) =>
	strapiRequest<User>(USERS, "findOne", { documentId })

export const createUser = async (data: Partial<User>): ApiResponse<User> =>
	strapiRequest<User>(USERS, "create", { data })

export const updateUser = async (
	documentId: string,
	data: Partial<User> & { volunteer?; group? },
	relationActions?: RelationAction<Group>[]
) => {
	for (const {
		entity: { singular: entitySingular },
		set,
		connect,
		disconnect
	} of relationActions) {
		if (set) {
			data[entitySingular] = {
				set: set.map(({ documentId }) => documentId)
			}
		}

		if (connect) {
			data[entitySingular] = {
				connect: connect.map(({ documentId }) => documentId)
			}
		}

		if (disconnect) {
			data[entitySingular] = {
				disconnect: disconnect.map(({ documentId }) => documentId)
			}
		}
	}

	let populate: string | string[] = "*"
	for (const { entity } of relationActions) {
		const { mediaFields } = entity
		if (populate === "*") {
			populate = []
		}
		if (Array.isArray(populate)) {
			populate = Object.keys(mediaFields).map((f) => `${entity.singular}.${f}`)
		}
	}
	return strapiRequest<User>(USERS, "update", { documentId, data })
}

export const deleteUser = (documentId: string) =>
	strapiRequest(USERS, "delete", { documentId })

export const getUsersBy = (params: StrapiFindParams) =>
	findEntity<User>(USERS, params)
