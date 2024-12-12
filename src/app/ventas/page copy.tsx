"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig"; // Importa la configuración de Firebase
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, increment } from "firebase/firestore";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { PackageSearch, Edit2, Trash2, Plus, Save, Box, Search, ImageIcon, Package, DollarSign, Grid, Type } from "lucide-react";
import { getAuth } from "firebase/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Definir la interfaz Producto
interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number; // Nuevo campo cantidad
  imagenUrl: string;
  categoria: string;
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [rolUsuario, setRolUsuario] = useState<string>("vendedor"); // Simular rol del usuario
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
  const [categoriaProducto, setCategoriaProducto] = useState("");
  const [busquedaCategoria, setBusquedaCategoria] = useState("");
  const [productosPorCategoria, setProductosPorCategoria] = useState<Producto[]>([]);
   const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const categoriasRef = collection(db, "categorias");
        const querySnapshot = await getDocs(categoriasRef);
        
        const categoriasList = querySnapshot.docs.map(doc => ({
          id: doc.id
        }));
        
        setCategorias(categoriasList);
      } catch (error) {
        console.error("Error fetching categorias:", error);
      }
    };

    fetchCategorias();
  }, []);

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
  
  const obtenerRolUsuario = async () => {
    const auth = getAuth();
    const user = auth.currentUser; // Obtienes el usuario autenticado
    
    if (user) {
      const usuarioRef = doc(db, "users", user.uid); // Usa el UID del usuario para la referencia
      const usuarioSnap = await getDoc(usuarioRef);
  
      if (usuarioSnap.exists()) {
        setRolUsuario(usuarioSnap.data().role); // Asumiendo que tienes un campo "role" en la colección de usuarios
      } else {
        console.error("Usuario no encontrado");
      }
    } else {
      console.error("No hay usuario autenticado");
    }
  };
  
  useEffect(() => {
    obtenerRolUsuario(); // Llamada para obtener el rol al cargar el componente
  }, []);

  // Función para agregar un nuevo producto
  const agregarProducto = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (idProducto <= 0) {
        alert("El ID del producto debe ser mayor a 0.");
        return;
      }

      const nuevoProducto: Producto = {
        id: idProducto,
        nombre: nombreProducto,
        descripcion: descripcionProducto,
        precio: precioProducto,
        cantidad: cantidadProducto,
        imagenUrl: imagenUrlProducto,
        categoria: categoriaProducto,
      };

      const docRef = doc(db, "Productos", idProducto.toString());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        alert("El ID del producto ya está en uso. Usa otro ID.");
        return;
      }

      await setDoc(docRef, nuevoProducto);
      setProductos([...productos, nuevoProducto]);

      setIdProducto(0);
      setNombreProducto("");
      setDescripcionProducto("");
      setPrecioProducto(0);
      setCantidadProducto(1);
      setImagenUrlProducto("");
      setCategoriaProducto("");
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
          ...docSnap.data(),
        } as Producto;
        setProductoBuscado(producto);
      } else {
        setProductoBuscado(null);
        alert("Producto no encontrado");
      }
    } catch (error) {
      console.error("Error al buscar producto: ", error);
    }
  };

  const buscarProductosPorCategoria = () => {
    if (!busquedaCategoria) {
      // Reset to show all products if category search is empty
      setProductosPorCategoria(productos);
      return;
    }
  
    const productosFiltrados = productos.filter(
      (producto) => 
        producto.categoria && 
        producto.categoria.toLowerCase().includes(busquedaCategoria.toLowerCase())
    );
  
    setProductosPorCategoria(productosFiltrados);
  
    // Optional: Add an alert if no products are found
    if (productosFiltrados.length === 0) {
      alert("No se encontraron productos en esta categoría");
    }
  };

  return (
    <div className="max-w-8xl mx-auto p-8 space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="flex items-center space-x-4 mb-8">
        <Box className="w-10 h-10 text-primary-500 stroke-[1.5]" />
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Gestión de Inventario
        </h1>
      </div>
  
      <div className="grid md:grid-cols-2 gap-8">
         {/* Formulario de Producto (visible solo si el usuario NO es "vendedor") */}
         {rolUsuario !== "vendedor" && (
        <Card className="shadow-2xl border-primary/20 hover:shadow-3xl transition-all duration-500 bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
        <div className="flex items-center space-x-4">
          {productoEditado ? (
            <Edit2 className="w-8 h-8 text-primary-500 drop-shadow-md" />
          ) : (
            <Plus className="w-8 h-8 text-primary-500 drop-shadow-md" />
          )}
          <div>
            <CardTitle className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {productoEditado ? "Editar Producto" : "Nuevo Producto"}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {productoEditado 
                ? "Modifica los detalles del producto seleccionado" 
                : "Agrega un nuevo producto a tu inventario"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form 
          onSubmit={productoEditado ? guardarCambios : agregarProducto} 
          className="space-y-6"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Nombre del Producto */}
            <div className="space-y-2">
              <Label 
                htmlFor="nombreProducto" 
                className="flex items-center text-gray-700 space-x-2"
              >
                <Type className="w-4 h-4 text-primary" />
                <span>Nombre del Producto</span>
              </Label>
              <div className="relative">
                <Input
                  id="nombreProducto"
                  value={nombreProducto}
                  onChange={(e) => setNombreProducto(e.target.value)}
                  required
                  className="pl-10 focus:border-primary focus:ring-2 focus:ring-primary/50"
                  placeholder="Ej: Smartphone X"
                />
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label 
                htmlFor="descripcionProducto" 
                className="flex items-center text-gray-700 space-x-2"
              >
                <Edit2 className="w-4 h-4 text-primary" />
                <span>Descripción</span>
              </Label>
              <div className="relative">
                <Input
                  id="descripcionProducto"
                  value={descripcionProducto}
                  onChange={(e) => setDescripcionProducto(e.target.value)}
                  required
                  className="pl-10 focus:border-primary focus:ring-2 focus:ring-primary/50"
                  placeholder="Descripción del producto"
                />
                <Edit2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* ID Producto */}
            <div className="space-y-2">
              <Label 
                htmlFor="idProducto" 
                className="flex items-center text-gray-700 space-x-2"
              >
                <Package className="w-4 h-4 text-primary" />
                <span>ID</span>
              </Label>
              <div className="relative">
                <Input
                  id="idProducto"
                  type="number"
                  value={idProducto}
                  onChange={(e) => setIdProducto(Number(e.target.value))}
                  required
                  className="pl-10 focus:border-primary focus:ring-2 focus:ring-primary/50"
                  placeholder="ID único"
                />
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label 
                htmlFor="categoria" 
                className="flex items-center text-gray-700 space-x-2"
              >
                <Grid className="w-4 h-4 text-primary" />
                <span>Categoría</span>
              </Label>
              <Select 
                value={categoriaSeleccionada}
                onValueChange={setCategoriaSeleccionada}
              >
                <SelectTrigger className="w-full pl-10">
                  <Grid className=" text-gray-400" />
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem 
                      key={categoria.id} 
                      value={categoria.id}
                    >
                      {categoria.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Precio */}
            <div className="space-y-2">
              <Label 
                htmlFor="precioProducto" 
                className="flex items-center text-gray-700 space-x-2"
              >
                <DollarSign className="w-4 h-4 text-primary" />
                <span>Precio ($)</span>
              </Label>
              <div className="relative">
                <Input
                  id="precioProducto"
                  type="number"
                  value={precioProducto}
                  onChange={(e) => setPrecioProducto(Number(e.target.value))}
                  required
                  className="pl-10 focus:border-primary focus:ring-2 focus:ring-primary/50"
                  placeholder="Precio del producto"
                />
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Cantidad */}
            <div className="space-y-2">
              <Label 
                htmlFor="cantidadProducto" 
                className="flex items-center text-gray-700 space-x-2"
              >
                <Package className="w-4 h-4 text-primary" />
                <span>Cantidad</span>
              </Label>
              <div className="relative">
                <Input
                  id="cantidadProducto"
                  type="number"
                  value={cantidadProducto}
                  onChange={(e) => setCantidadProducto(Number(e.target.value))}
                  required
                  min={1}
                  className="pl-10 focus:border-primary focus:ring-2 focus:ring-primary/50"
                  placeholder="Cantidad en stock"
                />
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* URL de Imagen */}
            <div className="space-y-2 md:col-span-2">
              <Label 
                htmlFor="imagenUrlProducto" 
                className="flex items-center text-gray-700 space-x-2"
              >
                <ImageIcon className="w-4 h-4 text-primary" />
                <span>URL de Imagen</span>
              </Label>
              <div className="relative">
                <Input
                  id="imagenUrlProducto"
                  value={imagenUrlProducto}
                  onChange={(e) => setImagenUrlProducto(e.target.value)}
                  required
                  className="pl-10 focus:border-primary focus:ring-2 focus:ring-primary/50"
                  placeholder="URL de la imagen del producto"
                />
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full mt-6 bg-primary hover:bg-primary-600 transition-colors group"
          >
            {productoEditado ? (
              <>
                <Save className="mr-2 h-5 w-5 group-hover:rotate-6 transition-transform" />
                Guardar Cambios
              </>
            ) : (
              <>
                <Plus className="mr-2 h-5 w-5 group-hover:rotate-6 transition-transform" />
                Agregar Producto
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )}
  
        {/* Búsqueda de Producto */}
        <Card className="shadow-2xl border-primary/20 hover:shadow-3xl transition-all duration-500 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
            <div className="flex items-center space-x-4">
              <PackageSearch className="w-8 h-8 text-primary-500 drop-shadow-md" />
              <div>
                <CardTitle className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  Buscar Producto
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Explora tu inventario por ID o categoría
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="ID del producto"
                    value={busquedaId}
                    onChange={(e) => setBusquedaId(e.target.value)}
                    className="flex-grow focus:ring-2 focus:ring-primary/50"
                  />
                  <Button 
                    onClick={buscarProductoPorId} 
                    variant="outline" 
                    className="border-primary text-primary hover:bg-primary/10"
                  >
                    <Search className="mr-2 h-4 w-4" /> Buscar
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="Categoría del producto"
                    value={busquedaCategoria}
                    onChange={(e) => setBusquedaCategoria(e.target.value)}
                    className="flex-grow focus:ring-2 focus:ring-primary/50"
                  />
                  <Button 
                    onClick={buscarProductosPorCategoria} 
                    variant="outline" 
                    className="border-primary text-primary hover:bg-primary/10"
                  >
                    <Search className="mr-2 h-4 w-4" /> Buscar
                  </Button>
                </div>
              </div>
            </div>

            {/* Resultados de búsqueda */}
            {(productoBuscado || productosPorCategoria.length > 0) && (
              <div className="mt-6 space-y-4">
                {productoBuscado && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-md">
                    <div className="flex items-center gap-6">
                      {productoBuscado.imagenUrl && (
                        <img
                          src={productoBuscado.imagenUrl}
                          alt={productoBuscado.nombre}
                          className="w-32 h-32 object-cover rounded-lg shadow-lg"
                        />
                      )}
                      <div className="flex-1 space-y-2">
                        <h3 className="text-2xl font-bold text-gray-900">{productoBuscado.nombre}</h3>
                        <p className="text-gray-600">{productoBuscado.descripcion}</p>
                        <div className="flex gap-4">
                          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">
                            ${productoBuscado.precio.toFixed(2)}
                          </div>
                          <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-semibold">
                            Stock: {productoBuscado.cantidad}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {productosPorCategoria.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xl font-semibold text-gray-800">
                      Resultados de Categoría: {busquedaCategoria}
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {productosPorCategoria.map((producto) => (
                        <div 
                          key={producto.id} 
                          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all"
                        >
                          <div className="flex items-center gap-4">
                            {producto.imagenUrl && (
                              <img
                                src={producto.imagenUrl}
                                alt={producto.nombre}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900">{producto.nombre}</h5>
                              <p className="text-xs text-gray-500">{producto.categoria}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventario de Productos */}
        <Card className="shadow-2xl border-primary/20 hover:shadow-3xl transition-all duration-500 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Box className="w-8 h-8 text-primary-500 drop-shadow-md" />
                <div>
                  <CardTitle className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    Inventario
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {productos.length} producto{productos.length !== 1 && 's'} en stock
                  </CardDescription>
                </div>
              </div>
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
              <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
                {productos.map((producto, index) => (
                  <div 
                    key={producto.id} 
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all group relative"
                  >
                    <div className="flex items-center gap-4">
                      {producto.imagenUrl && (
                        <img
                          src={producto.imagenUrl}
                          alt={producto.nombre}
                          className="w-24 h-24 object-cover rounded-lg shadow-md"
                        />
                      )}
                      <div className="flex-1 space-y-2">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{producto.nombre}</h4>
                          <p className="text-sm text-gray-600">{producto.descripcion}</p>
                          <p className="text-sm text-gray-600">ID: {producto.id}</p>
                        </div>
                        <div className="flex gap-3">
                          <div className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                            ${producto.precio.toFixed(2)}
                          </div>
                          <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                            Stock: {producto.cantidad}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editarProducto(index)}
                        className="h-8 px-2 gap-1 hover:bg-primary/10"
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
      </div>

      {/* Alert Dialog */}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent className="bg-white shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-primary">¡Producto Agregado!</AlertDialogTitle>
            <AlertDialogDescription>
              El producto ha sido agregado correctamente al inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end">
            <AlertDialogCancel onClick={() => setShowAlert(false)} className="hover:bg-gray-100">
              Cerrar
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}