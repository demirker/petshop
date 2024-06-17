export interface Encargo {
  estado: string;
  idC: string;
  idE: string;
  productos: ProductoSimple[];
  totalPagar: number;
  modalidad: string;
  metodoPago: string;
}

export interface ProductoSimple {
  name: string;
  price: number;
  image: string;
  id: string;
  discount?: number;
  cantidad: number;
}
