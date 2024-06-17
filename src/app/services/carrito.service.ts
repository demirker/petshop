import { Injectable, EventEmitter } from '@angular/core';
import { Product } from '../models/product.model';
import { ProductoSimple } from '../models/encargo.model';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  public carrito: { [key: string]: Product & { quantity: number } } = {};
  carritoActualizado = new EventEmitter<void>();
  stockNoDisponible = new EventEmitter<void>(); // Nuevo evento para manejar stock no disponible

  constructor() {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
      this.carrito = JSON.parse(carritoGuardado);
    }
  }

  private guardarCarritoEnLocalStorage() {
    console.log('Carrito antes de guardar:', this.carrito);
    localStorage.setItem('carrito', JSON.stringify(this.carrito));
    this.carritoActualizado.emit();
  }

  addToCart(producto: Product, quantity: number = 1) {
    if (producto.stockAvailable >= quantity) {
      if (this.carrito[producto.id]) {
        this.carrito[producto.id].quantity += quantity;
      } else {
        this.carrito[producto.id] = { ...producto, quantity };
      }
      producto.stockAvailable -= quantity;
      this.guardarCarritoEnLocalStorage();
    } else {
      this.stockNoDisponible.emit();
    }
  }

  removeFromCart(producto: Product, quantity: number = 1) {
    if (this.carrito[producto.id]) {
      const productoEnCarrito = this.carrito[producto.id];
      if (productoEnCarrito.quantity <= quantity) {
        delete this.carrito[producto.id];
      } else {
        productoEnCarrito.quantity -= quantity;
      }
      producto.stockAvailable += quantity;
      this.guardarCarritoEnLocalStorage();
    }
  }

  getTotal(): number {
    return Object.values(this.carrito).reduce((total, producto) => {
      const precioConDescuento = producto.price * (1 - (producto.discount / 100));
      return total + (precioConDescuento * producto.quantity);
    }, 0);
  }

  getCarrito() {
    return Object.values(this.carrito);
  }

  getCarritoSimplificado(): ProductoSimple[] {
    return Object.values(this.carrito).map(producto => ({
      name: producto.name,
      price: producto.price,
      image: producto.image,
      id: producto.id,
      discount: producto.discount,
      cantidad: producto.quantity,
    }));
  }

  vaciarCarrito() {
    this.carrito = {};
    this.guardarCarritoEnLocalStorage();
  }

  getCarritoActualizado() {
    return this.carritoActualizado;
  }

  getProductQuantityInCart(product: Product): number {
    return this.carrito[product.id]?.quantity || 0;
  }
}
