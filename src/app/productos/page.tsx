"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig"; // Importa la configuración de Firebase
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, increment } from "firebase/firestore";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { PackageSearch, Edit2, Trash2, Plus, Save, Box } from "lucide-react";

// Definir la interfaz Producto
interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number; // Nuevo campo cantidad
  imagenUrl: string;
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [nombreProducto, setNombreProducto] = useState("");
  const [descripcionProducto, setDescripcionProducto] = useState("");
  const [idProducto, setIdProducto] = useState(0); // Estado para manejar el ID manual
  const [precioProducto, setPrecioProducto] = useState(0);
  const [cantidadProducto, setCantidadProducto] = useState(1); // Estado para cantidad
  const [imagenUrlProducto, setImagenUrlProducto] = useState("");
  const [productoEditado, setProductoEditado] = useState<Producto | null>(null);
  const [showAlert, setShowAlert] = useState(false); // Estado para controlar el AlertDialog
  const [busquedaId, setBusquedaId] = useState<number | string>("");
  const [productoBuscado, setProductoBuscado] = useState<Producto | null>(null);

  // Obtener la colección de productos desde la base de datos
  useEffect(() => {
    const obtenerProductos = async () => {
      const querySnapshot = await getDocs(collection(db, "Productos"));
      const productosObtenidos: Producto[] = [];
      querySnapshot.forEach((doc) => {
        productosObtenidos.push({ id: Number(doc.id), ...doc.data() } as Producto);
      });
      setProductos(productosObtenidos);
    };

    obtenerProductos();
  }, []);

  // Función para obtener y actualizar el LastId en la colección counters
  const obtenerNuevoId = async () => {
    const docRef = doc(db, "counters", "productosCounters");
    const docSnap = await getDoc(docRef);
  
    if (docSnap.exists()) {
      const lastId = docSnap.data().LastId;
      await updateDoc(docRef, { LastId: increment(1) });
      return lastId + 1;
    } else {
      // Crear el documento si no existe
      await setDoc(docRef, { LastId: 1 });
      return 1; // Devuelve el primer ID
    }
  };

  // Función para agregar un nuevo producto
const agregarProducto = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    if (idProducto <= 0) {
      alert("El ID del producto debe ser mayor a 0.");
      return;
    }

    const nuevoProducto: Producto = {
      id: idProducto, // Usa el ID ingresado por el usuario
      nombre: nombreProducto,
      descripcion: descripcionProducto,
      precio: precioProducto,
      cantidad: cantidadProducto,
      imagenUrl: imagenUrlProducto,
    };

    // Verificar si el documento ya existe
    const docRef = doc(db, "Productos", idProducto.toString());
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      alert("El ID del producto ya está en uso. Usa otro ID.");
      return;
    }

    await setDoc(docRef, nuevoProducto); // Crear el documento con el ID específico
    setProductos([...productos, nuevoProducto]);

    // Resetear los campos del formulario
    setIdProducto(0);
    setNombreProducto("");
    setDescripcionProducto("");
    setPrecioProducto(0);
    setCantidadProducto(1);
    setImagenUrlProducto("");
    setShowAlert(true); // Mostrar alerta de éxito
  } catch (error) {
    console.error("Error al agregar producto: ", error);
  }
};

 // Función para editar un producto
 const editarProducto = (index: number) => {
  const producto = productos[index];
  setProductoEditado(producto);
  setNombreProducto(producto.nombre);
  setDescripcionProducto(producto.descripcion);
  setPrecioProducto(producto.precio);
  setCantidadProducto(producto.cantidad); // Cargar la cantidad
  setImagenUrlProducto(producto.imagenUrl);
};

const guardarCambios = async (e: React.FormEvent) => {
  e.preventDefault();

  if (productoEditado) {
    const productoActualizado: Producto = {
      ...productoEditado, // No cambiar el ID
      nombre: nombreProducto,
      descripcion: descripcionProducto,
      precio: precioProducto,
      cantidad: cantidadProducto,
      imagenUrl: imagenUrlProducto,
    };

    try {
      await updateDoc(doc(db, "Productos", productoEditado.id.toString()), 
        productoActualizado as Partial<Producto>
      );

      setProductos(
        productos.map((producto) =>
          producto.id === productoEditado.id ? productoActualizado : producto
        )
      );

      setProductoEditado(null);
      setNombreProducto("");
      setDescripcionProducto("");
      setPrecioProducto(0);
      setCantidadProducto(1);
      setImagenUrlProducto("");
    } catch (error) {
      console.error("Error al actualizar producto: ", error);
    }
  }
};

  // Función para eliminar un producto
  const eliminarProducto = async (index: number) => {
    const producto = productos[index];
    try {
      // Eliminar el producto de la base de datos
      await deleteDoc(doc(db, "Productos", producto.id.toString()));
      
      // Filtrar el producto de la lista local (productos) para actualizar la UI
      setProductos(productos.filter((p) => p.id !== producto.id));
    } catch (error) {
      console.error("Error al eliminar producto: ", error);
    }
  };

  // Función para buscar producto por ID
  const buscarProductoPorId = async () => {
    if (!busquedaId) return;
  
    try {
      const docRef = doc(db, "Productos", busquedaId.toString());
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        const producto: Producto = {
          id: Number(docSnap.id),
          nombre: docSnap.data().nombre,
          descripcion: docSnap.data().descripcion,
          precio: docSnap.data().precio,
          cantidad: docSnap.data().cantidad,
          imagenUrl: docSnap.data().imagenUrl
        };
        setProductoBuscado(producto);
      } else {
        setProductoBuscado(null);
        alert("Producto no encontrado");
      }
    } catch (error) {
      console.error("Error al buscar producto: ", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      <div className="flex items-center space-x-4 mb-8">
        <Box className="w-10 h-10 text-primary-500 stroke-[1.5]" />
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Gestión de Inventario
        </h1>
      </div>
  
      <div className="grid md:grid-cols-2 gap-8">
        {/* Formulario de Producto */}
        <Card className="shadow-lg border-primary/10 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-primary-50/50 border-b border-primary/10">
            <div className="flex items-center space-x-3">
              {productoEditado ? <Edit2 className="w-6 h-6 text-primary" /> : <Plus className="w-6 h-6 text-primary" />}
              <CardTitle className="text-2xl font-bold text-gray-800">
                {productoEditado ? "Editar Producto" : "Nuevo Producto"}
              </CardTitle>
            </div>
            <CardDescription>
              {productoEditado 
                ? "Modifica los detalles del producto seleccionado" 
                : "Agrega un nuevo producto a tu inventario"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form 
              onSubmit={productoEditado ? guardarCambios : agregarProducto} 
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombreProducto" className="text-gray-700">Nombre del Producto</Label>
                  <Input
                    id="nombreProducto"
                    value={nombreProducto}
                    onChange={(e) => setNombreProducto(e.target.value)}
                    required
                    className="focus:border-primary focus:ring-primary/50"
                    placeholder="Ej: Smartphone X"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcionProducto" className="text-gray-700">Descripción</Label>
                  <Input
                    id="descripcionProducto"
                    value={descripcionProducto}
                    onChange={(e) => setDescripcionProducto(e.target.value)}
                    required
                    className="focus:border-primary focus:ring-primary/50"
                    placeholder="Descripción del producto"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idProducto" className="text-gray-700">ID</Label>
                  <Input
                    id="idProducto"
                    type="number"
                    value={idProducto}
                    onChange={(e) => setIdProducto(Number(e.target.value))}
                    required
                    className="focus:border-primary focus:ring-primary/50"
                    placeholder="ID único"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precioProducto" className="text-gray-700">Precio ($)</Label>
                  <Input
                    id="precioProducto"
                    type="number"
                    value={precioProducto}
                    onChange={(e) => setPrecioProducto(Number(e.target.value))}
                    required
                    className="focus:border-primary focus:ring-primary/50"
                    placeholder="Precio del producto"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cantidadProducto" className="text-gray-700">Cantidad</Label>
                  <Input
                    id="cantidadProducto"
                    type="number"
                    value={cantidadProducto}
                    onChange={(e) => setCantidadProducto(Number(e.target.value))}
                    required
                    min={1}
                    className="focus:border-primary focus:ring-primary/50"
                    placeholder="Cantidad en stock"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="imagenUrlProducto" className="text-gray-700">URL de Imagen</Label>
                  <Input
                    id="imagenUrlProducto"
                    value={imagenUrlProducto}
                    onChange={(e) => setImagenUrlProducto(e.target.value)}
                    required
                    className="focus:border-primary focus:ring-primary/50"
                    placeholder="URL de la imagen del producto"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full mt-4 bg-primary hover:bg-primary-600 transition-colors"
              >
                {productoEditado ? (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Guardar Cambios
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    Agregar Producto
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
  
        {/* Búsqueda de Producto */}
        <Card className="shadow-lg border-primary/10 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gray-50/50 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <PackageSearch className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl font-bold text-gray-800">
                Buscar Producto
              </CardTitle>
            </div>
            <CardDescription>
              Encuentra productos rápidamente por su ID
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex space-x-3">
              <Input
                type="number"
                placeholder="Ingresa ID del producto"
                value={busquedaId}
                onChange={(e) => setBusquedaId(e.target.value)}
                className="flex-grow focus:border-primary focus:ring-primary/50"
              />
              <Button 
                onClick={buscarProductoPorId} 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary/10"
              >
                <PackageSearch className="mr-2 h-5 w-5" />
                Buscar
              </Button>
            </div>
  
            {productoBuscado && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold text-gray-900">{productoBuscado.nombre}</h3>
                      <p className="text-gray-600">{productoBuscado.descripcion}</p>
                      <p className="text-gray-600">ID: {productoBuscado.id}</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="px-3 py-1 rounded-lg bg-primary/10 text-primary font-medium">
                        ${productoBuscado.precio}
                      </div>
                      <div className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium">
                        Stock: {productoBuscado.cantidad}
                      </div>
                    </div>
                  </div>
                  {productoBuscado.imagenUrl && (
                    <div className="relative flex-shrink-0">
                      <img
                        src={productoBuscado.imagenUrl}
                        alt={productoBuscado.nombre}
                        className="w-32 h-32 object-cover rounded-lg shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  
      {/* Lista de Productos */}
      <Card className="shadow-lg border-primary/10">
        <CardHeader className="bg-gray-50/50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Box className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl font-bold text-gray-800">
                Inventario de Productos
              </CardTitle>
            </div>
            <p className="text-gray-500">
              Total de productos: {productos.length}
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {productos.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <p className="text-gray-500 text-lg">
                No hay productos en el inventario
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productos.map((producto, index) => (
                <div 
                  key={producto.id} 
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 group relative"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-gray-900">{producto.nombre}</h3>
                        <p className="text-gray-600 text-sm">{producto.descripcion}</p>
                        <p className="text-gray-500 text-xs">ID: {producto.id}</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="px-2 py-1 rounded-lg bg-primary/10 text-primary font-medium text-sm">
                          ${producto.precio}
                        </div>
                        <div className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium text-sm">
                          Stock: {producto.cantidad}
                        </div>
                      </div>
                    </div>
                    {producto.imagenUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={producto.imagenUrl}
                          alt={producto.nombre}
                          className="w-24 h-24 object-cover rounded-lg shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editarProducto(index)}
                      className="h-8 px-2 gap-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => eliminarProducto(index)}
                      className="h-8 px-2 gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
  
      {/* Alert Dialog */}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¡Producto Agregado!</AlertDialogTitle>
            <AlertDialogDescription>
              El producto ha sido agregado correctamente al inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end">
            <AlertDialogCancel onClick={() => setShowAlert(false)}>
              Cerrar
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}