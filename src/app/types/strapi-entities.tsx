export interface BaseStrapiEntity {
	id: number
	documentId: string
	createdAt: Date
	updatedAt: Date
	publishedAt: Date
}

export interface User extends BaseStrapiEntity {
    name: any
    username: string;
    email: string;
    provider: string;
    confirmed: boolean;
    blocked: boolean;
}

export interface Group extends BaseStrapiEntity {
    name: string;
    branch: Branch
    users?: User[];
}

export interface Department extends BaseStrapiEntity {
    name: string;
}

export interface Material extends BaseStrapiEntity {
    name: string;
    description?: string;
    quantity: number;
    material_movements: MaterialMovement[];
    group?: Group[];
    department?: Department[];
    unit: Medidas;
}

export interface MaterialMovement extends BaseStrapiEntity {
    quantity: number;
    movement_type: MovimientosM;
    movement_date: Date;
    notes?: string;
    material: Material;
    department: Department;

}

export interface Tool extends BaseStrapiEntity {
    name: string;
    amount: number;
    department?: Department[];
    group?: Group[];
    description?: string;
    purchase_date?: Date;
    warrantyExpirationDate?: Date;
}

export interface Volunteer extends BaseStrapiEntity {
    name: string;
    mail: string;
    volunteerBethelId?: string;
    user: User[];
}


type Branch = "Argentina and Uruguay" | "Brazil";

type Medidas= "Kg" | "Mts" | "Cms" | "Caja";

type MovimientosM = "entry" | "exit" ;