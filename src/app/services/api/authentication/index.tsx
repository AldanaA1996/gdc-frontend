import { User } from "@/app/types/strapi-entities"
import { api, ApiResponse, mapApiErrors } from ".."
import { updateUser } from "../user"
import { VOLUNTEER_ENTITY_METADATA } from "../volunteers"

export const requestLogin = async (
	email: string,
	password: string
): ApiResponse<{ jwt: string; user: User }> => {
	try {
		const result = await api.post("/auth/local", {
			identifier: email,
			password
		})

		return result
	} catch (error) {
		return { error: error?.response }
	}
}

export const requestRegister = async (
	username: string,
	password: string,
	email: string,
	group: string,
	
): ApiResponse<{ jwt: string; user: User }> => {
	try {
		const result = await api.post("/auth/local/register", {
			username,
			email,
			password,
			
		})

		console.log("result", result)

		if (result.data.error) {
			return { error: result.data.error }
		}
		const {
			data: { user, jwt }
		} = result
		if (!jwt) {
			return { error: { message: "No se ha podido crear el usuario" } }
		}

		const resultUser = await updateUser(
			user.id,
			{
				
				// group: { set: [group] },
			},
			[{ entity: VOLUNTEER_ENTITY_METADATA, set: [user] }]
		)
		if (resultUser.error) {
			return { error: resultUser.error }
		}
		result.data.user = resultUser.data
		return result
	} catch (error) {
		return { error: error?.response }
	}
}

export const requestResetPassword = async (
	email: string
): Promise<ApiResponse<null>> => {
	try {
		const response = await api.post("/auth/forgot-password", { email })
		console.log("Correo de recuperación envido:", response.data)

		return { data: null }
	} catch (error: any) {
		console.error("Error al enviar el correo de recuperación:", error.response)
		return { error: error.response }
	}
}

export const requestChangePassword = async (
	code: string,
	newpassword: string
): ApiResponse<{ jwt: string; user: User }> => {
	try {
		const result = await api.post("/auth/reset-password", {
			password: newpassword,
			passwordConfirmation: newpassword,
			code: code
		})

		return result
	} catch (error: any) {
		return { error: error?.response }
	}
}
export const mapLoginErrors = {
	...mapApiErrors,
	ValidationError: "Credenciales incorrectas"
}
