"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig"; 
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from "firebase/firestore"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Users, Package, DollarSign } from "lucide-react";

interface Venta {
  cliente: string;
  producto: string;
  cantidad: number;
  vendedor: string;
  fecha: string;
  precio: number;
  total: number;
}

interface Cliente {
  nombreCliente: string;
}

interface Vendedor {
  Nombre: string;
}

interface Producto {
  nombre: string;
  precio: number;
  cantidad: number; // Se añade el campo cantidad al Producto
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cliente, setCliente] = useState<string>("");
  const [producto, setProducto] = useState<string>("");
  const [cantidad, setCantidad] = useState<number>(0);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [vendedor, setVendedor] = useState<string>("");
  const [fecha, setFecha] = useState<string>(new Date().toLocaleDateString());
  const [precioProducto, setPrecioProducto] = useState<number>(0);

  // Obtener ventas desde la base de datos
  useEffect(() => {
    const obtenerVentas = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Ventas"));
        const ventasObtenidas: Venta[] = querySnapshot.docs.map((doc) => doc.data() as Venta);
        setVentas(ventasObtenidas);
      } catch (error) {
        console.error("Error al obtener las ventas: ", error);
      }
    };

    obtenerVentas();
  }, []); 

  // Obtener clientes desde la base de datos
  useEffect(() => {
    const obtenerClientes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Clientes"));
        const clientesObtenidos: Cliente[] = querySnapshot.docs.map((doc) => doc.data() as Cliente);
        setClientes(clientesObtenidos);
      } catch (error) {
        console.error("Error al obtener los clientes: ", error);
      }
    };

    obtenerClientes();
  }, []);

  // Obtener productos y precios de la base de datos
  useEffect(() => {
    const obtenerProductos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Productos"));
        const productos: Producto[] = querySnapshot.docs.map((doc) => ({
          nombre: doc.data().nombre,
          precio: doc.data().precio,
          cantidad: doc.data().cantidad, // Aseguramos que se obtenga la cantidad disponible
        }));
        setProductosDisponibles(productos);
      } catch (error) {
        console.error("Error al obtener los productos: ", error);
      }
    };

    obtenerProductos();
  }, []);

  // Obtener vendedores desde la base de datos
  useEffect(() => {
    const obtenerVendedores = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Vendedores"));
        const vendedoresObtenidos: Vendedor[] = querySnapshot.docs.map((doc) => doc.data() as Vendedor);
        setVendedores(vendedoresObtenidos);
      } catch (error) {
        console.error("Error al obtener los vendedores: ", error);
      }
    };

    obtenerVendedores();
  }, []);

  // Actualizar el precio del producto al seleccionar uno
  const actualizarPrecioProducto = (productoSeleccionado: string) => {
    const productoEncontrado = productosDisponibles.find(
      (prod) => prod.nombre === productoSeleccionado
    );
    if (productoEncontrado) {
      setPrecioProducto(productoEncontrado.precio);
    }
  };

  const registrarVenta = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    try {
      // Obtener la referencia actual del producto
      const productosRef = collection(db, "Productos");
      const q = query(productosRef, where("nombre", "==", producto));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert("Producto no encontrado");
        return;
      }

      const productoDoc = querySnapshot.docs[0];
      const productoActual = productoDoc.data() as Producto;

      // Verificar si hay suficiente stock
      if (productoActual.cantidad < cantidad) {
        alert(`No hay suficiente stock. Stock disponible: ${productoActual.cantidad}`);
        return;
      }

      // Calcular el total de la venta
      const totalVenta = precioProducto * cantidad;
      
      // Crear el objeto de venta
      const nuevaVenta: Venta = {
        cliente,
        producto,
        cantidad,
        vendedor,
        fecha,
        precio: precioProducto,
        total: totalVenta,
      };

      // Registrar la venta
      await addDoc(collection(db, "Ventas"), nuevaVenta);
      
      // Actualizar el stock del producto
      const nuevaCantidad = productoActual.cantidad - cantidad;
      await updateDoc(productoDoc.ref, {
        cantidad: nuevaCantidad
      });

      // Actualizar el estado local de ventas
      setVentas([...ventas, nuevaVenta]);
      
      // Actualizar el estado local de productos disponibles
      setProductosDisponibles(productosDisponibles.map(prod => 
        prod.nombre === producto 
          ? { ...prod, cantidad: nuevaCantidad }
          : prod
      ));

      // Limpiar el formulario
      setCliente("");
      setProducto("");
      setCantidad(0);
      setVendedor("");
      setPrecioProducto(0);

      
    } catch (error) {
      console.error("Error al registrar la venta: ", error);
      alert("Error al registrar la venta");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        <Card className="bg-blue-50 hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-6">
            <div className="rounded-full bg-blue-500 p-3 mr-4 shadow-md">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Ventas</p>
              <h3 className="text-2xl font-bold text-blue-800">{ventas.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-6">
            <div className="rounded-full bg-green-500 p-3 mr-4 shadow-md">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas del Día</p>
              <h3 className="text-2xl font-bold text-green-800">
                ${ventas
                  .filter(v => v.fecha === new Date().toLocaleDateString())
                  .reduce((acc, v) => acc + v.total, 0)
                  .toLocaleString()}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-6">
            <div className="rounded-full bg-orange-500 p-3 mr-4 shadow-md">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Productos</p>
              <h3 className="text-2xl font-bold text-orange-800">{productosDisponibles.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Nueva Venta Section */}
        <Card className="lg:col-span-1 border-2 border-blue-100">
          <CardHeader className="border-b border-blue-100">
            <CardTitle className="text-2xl font-bold flex items-center gap-3 text-blue-800">
              <ShoppingCart className="h-7 w-7 text-blue-600" />
              Nueva Venta
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={registrarVenta} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="producto" className="text-sm font-semibold text-gray-700">
                  Producto
                </Label>
                <Select
                  onValueChange={(value) => {
                    setProducto(value);
                    actualizarPrecioProducto(value);
                  }}
                  value={producto}
                  required
                >
                  <SelectTrigger className="w-full border-blue-200 focus:ring-2 focus:ring-blue-300">
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productosDisponibles.map((prod, index) => (
                      <SelectItem 
                        key={index} 
                        value={prod.nombre} 
                        className="hover:bg-blue-50"
                      >
                        {`${prod.nombre} - $${prod.precio} (Stock: ${prod.cantidad})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="cantidad" className="text-sm font-semibold text-gray-700">
                    Cantidad
                  </Label>
                  <Input
                    type="number"
                    id="cantidad"
                    value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))}
                    min={1}
                    max={producto && productosDisponibles.find((prod) => prod.nombre === producto)?.cantidad}
                    required
                    className="w-full border-blue-200 focus:ring-2 focus:ring-blue-300"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="precio" className="text-sm font-semibold text-gray-700">
                    Precio Unitario
                  </Label>
                  <Input
                    type="number"
                    id="precio"
                    value={precioProducto}
                    disabled
                    className="w-full bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="vendedor" className="text-sm font-semibold text-gray-700">
                  Vendedor
                </Label>
                <Select 
                  onValueChange={(value) => setVendedor(value)} 
                  value={vendedor} 
                  required
                >
                  <SelectTrigger className="w-full border-blue-200 focus:ring-2 focus:ring-blue-300">
                    <SelectValue placeholder="Seleccionar vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendedores.map((vendedor, index) => (
                      <SelectItem 
                        key={index} 
                        value={vendedor.Nombre}
                        className="hover:bg-blue-50"
                      >
                        {vendedor.Nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="fecha" className="text-sm font-semibold text-gray-700">
                  Fecha
                </Label>
                <Input
                  type="text"
                  id="fecha"
                  value={fecha}
                  disabled
                  className="w-full bg-gray-100 cursor-not-allowed"
                />
              </div>

              <CardFooter className="px-0 pt-6">
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Registrar Venta
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>

        {/* Últimas Ventas Section */}
        <Card className="lg:col-span-1 border-2 border-green-100">
          <CardHeader className="border-b border-green-100">
            <CardTitle className="text-2xl font-bold flex items-center gap-3 text-green-800">
              <ShoppingCart className="h-7 w-7 text-green-600" />
              Últimas Ventas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="rounded-lg border border-green-200">
              <Table>
                <TableHeader className="bg-green-50">
                  <TableRow>
                    <TableHead className="text-green-700">Producto</TableHead>
                    <TableHead className="text-right text-green-700">Cantidad</TableHead>
                    <TableHead className="text-right text-green-700">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventas.slice(-5).map((venta, index) => (
                    <TableRow key={index} className="hover:bg-green-50">
                      <TableCell>{venta.producto}</TableCell>
                      <TableCell className="text-right">{venta.cantidad}</TableCell>
                      <TableCell className="text-right">${venta.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial de Ventas Section */}
      <Card className="border-2 border-purple-100">
        <CardHeader className="border-b border-purple-100">
          <CardTitle className="text-2xl font-bold flex items-center gap-3 text-purple-800">
            <ShoppingCart className="h-7 w-7 text-purple-600" />
            Historial de Ventas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-lg border border-purple-200">
            <Table>
              <TableHeader className="bg-purple-50">
                <TableRow>
                  <TableHead className="text-purple-700">Producto</TableHead>
                  <TableHead className="text-purple-700">Vendedor</TableHead>
                  <TableHead className="text-purple-700">Fecha</TableHead>
                  <TableHead className="text-right text-purple-700">Cantidad</TableHead>
                  <TableHead className="text-right text-purple-700">Precio</TableHead>
                  <TableHead className="text-right text-purple-700">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventas.map((venta, index) => (
                  <TableRow key={index} className="hover:bg-purple-50">
                    <TableCell>{venta.producto}</TableCell>
                    <TableCell>{venta.vendedor}</TableCell>
                    <TableCell>{venta.fecha}</TableCell>
                    <TableCell className="text-right">{venta.cantidad}</TableCell>
                    <TableCell className="text-right">${venta.precio}</TableCell>
                    <TableCell className="text-right">${venta.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}