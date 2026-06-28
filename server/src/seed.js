const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const products = [
  // 🍎 ALIMENTACIÓN
  { name: 'Arroz blanco 1kg', category: 'alimentacion', subcategory: 'arroz', basePrice: 1.20, wholesalePrice: 0.95, quality: 45, rarity: 5, manufacturingCost: 0.70, demandFactor: 2.0 },
  { name: 'Arroz integral 1kg', category: 'alimentacion', subcategory: 'arroz', basePrice: 1.80, wholesalePrice: 1.40, quality: 55, rarity: 10, manufacturingCost: 1.00, demandFactor: 1.5 },
  { name: 'Pasta espagueti 500g', category: 'alimentacion', subcategory: 'pasta', basePrice: 0.90, wholesalePrice: 0.70, quality: 40, rarity: 5, manufacturingCost: 0.50, demandFactor: 2.0 },
  { name: 'Pasta rigatoni 500g', category: 'alimentacion', subcategory: 'pasta', basePrice: 1.00, wholesalePrice: 0.75, quality: 42, rarity: 5, manufacturingCost: 0.55, demandFactor: 1.8 },
  { name: 'Aceite de oliva virgen extra 1L', category: 'alimentacion', subcategory: 'aceite', basePrice: 4.50, wholesalePrice: 3.50, quality: 70, rarity: 15, manufacturingCost: 2.80, demandFactor: 1.5 },
  { name: 'Aceite de girasol 1L', category: 'alimentacion', subcategory: 'aceite', basePrice: 1.80, wholesalePrice: 1.40, quality: 35, rarity: 5, manufacturingCost: 1.10, demandFactor: 2.0 },
  { name: 'Harina de trigo 1kg', category: 'alimentacion', subcategory: 'harina', basePrice: 0.80, wholesalePrice: 0.60, quality: 35, rarity: 5, manufacturingCost: 0.45, demandFactor: 1.8 },
  { name: 'Azúcar blanco 1kg', category: 'alimentacion', subcategory: 'azucar', basePrice: 1.00, wholesalePrice: 0.75, quality: 35, rarity: 5, manufacturingCost: 0.55, demandFactor: 1.9 },
  { name: 'Sal fina 1kg', category: 'alimentacion', subcategory: 'sal', basePrice: 0.60, wholesalePrice: 0.45, quality: 30, rarity: 5, manufacturingCost: 0.35, demandFactor: 1.5 },
  { name: 'Tomate frito 400g', category: 'alimentacion', subcategory: 'conservas', basePrice: 1.50, wholesalePrice: 1.10, quality: 50, rarity: 5, manufacturingCost: 0.85, demandFactor: 2.0 },
  { name: 'Atún en lata 120g', category: 'alimentacion', subcategory: 'conservas', basePrice: 1.80, wholesalePrice: 1.35, quality: 55, rarity: 10, manufacturingCost: 1.00, demandFactor: 2.0 },
  { name: 'Garbanzos cocidos 400g', category: 'alimentacion', subcategory: 'conservas', basePrice: 1.20, wholesalePrice: 0.90, quality: 45, rarity: 5, manufacturingCost: 0.65, demandFactor: 1.5 },
  { name: 'Lentejas cocidas 400g', category: 'alimentacion', subcategory: 'conservas', basePrice: 1.15, wholesalePrice: 0.85, quality: 45, rarity: 5, manufacturingCost: 0.65, demandFactor: 1.5 },
  { name: 'Pan de molde 500g', category: 'alimentacion', subcategory: 'pan', basePrice: 2.00, wholesalePrice: 1.50, quality: 50, rarity: 5, manufacturingCost: 1.10, demandFactor: 2.0 },
  { name: 'Leche entera 1L', category: 'alimentacion', subcategory: 'lacteos', basePrice: 0.95, wholesalePrice: 0.75, quality: 40, rarity: 5, manufacturingCost: 0.55, demandFactor: 2.5 },
  { name: 'Yogur natural pack 4', category: 'alimentacion', subcategory: 'lacteos', basePrice: 1.80, wholesalePrice: 1.40, quality: 50, rarity: 5, manufacturingCost: 1.00, demandFactor: 2.0 },
  { name: 'Queso curado 200g', category: 'alimentacion', subcategory: 'lacteos', basePrice: 3.50, wholesalePrice: 2.80, quality: 65, rarity: 15, manufacturingCost: 2.00, demandFactor: 1.5 },
  { name: 'Mantequilla 250g', category: 'alimentacion', subcategory: 'lacteos', basePrice: 2.00, wholesalePrice: 1.55, quality: 50, rarity: 5, manufacturingCost: 1.10, demandFactor: 1.8 },
  { name: 'Huevos frescos pack 12', category: 'alimentacion', subcategory: 'huevos', basePrice: 2.40, wholesalePrice: 1.80, quality: 55, rarity: 5, manufacturingCost: 1.30, demandFactor: 2.5 },
  { name: 'Cereales desayuno 500g', category: 'alimentacion', subcategory: 'cereales', basePrice: 2.80, wholesalePrice: 2.10, quality: 50, rarity: 5, manufacturingCost: 1.50, demandFactor: 1.8 },
  { name: 'Café molido 250g', category: 'alimentacion', subcategory: 'cafe', basePrice: 3.20, wholesalePrice: 2.50, quality: 60, rarity: 15, manufacturingCost: 1.80, demandFactor: 2.0 },
  { name: 'Chocolate con leche 100g', category: 'alimentacion', subcategory: 'dulces', basePrice: 1.50, wholesalePrice: 1.15, quality: 55, rarity: 10, manufacturingCost: 0.85, demandFactor: 1.8 },
  { name: 'Galletas María 400g', category: 'alimentacion', subcategory: 'dulces', basePrice: 1.60, wholesalePrice: 1.20, quality: 40, rarity: 5, manufacturingCost: 0.85, demandFactor: 2.0 },
  { name: 'Mermelada de fresa 350g', category: 'alimentacion', subcategory: 'dulces', basePrice: 2.00, wholesalePrice: 1.55, quality: 50, rarity: 10, manufacturingCost: 1.10, demandFactor: 1.5 },
  { name: 'Miel 250g', category: 'alimentacion', subcategory: 'dulces', basePrice: 3.50, wholesalePrice: 2.70, quality: 65, rarity: 20, manufacturingCost: 2.00, demandFactor: 1.3 },

  // 🥤 BEBIDAS
  { name: 'Agua mineral 1.5L', category: 'bebidas', subcategory: 'agua', basePrice: 0.60, wholesalePrice: 0.45, quality: 35, rarity: 5, manufacturingCost: 0.30, demandFactor: 2.5 },
  { name: 'Agua con gas 1L', category: 'bebidas', subcategory: 'agua', basePrice: 0.90, wholesalePrice: 0.70, quality: 40, rarity: 5, manufacturingCost: 0.50, demandFactor: 1.5 },
  { name: 'Refresco cola 2L', category: 'bebidas', subcategory: 'refrescos', basePrice: 1.80, wholesalePrice: 1.40, quality: 45, rarity: 5, manufacturingCost: 0.95, demandFactor: 2.5 },
  { name: 'Refresco naranja 2L', category: 'bebidas', subcategory: 'refrescos', basePrice: 1.80, wholesalePrice: 1.40, quality: 42, rarity: 5, manufacturingCost: 0.95, demandFactor: 2.2 },
  { name: 'Refresco limón 2L', category: 'bebidas', subcategory: 'refrescos', basePrice: 1.80, wholesalePrice: 1.40, quality: 42, rarity: 5, manufacturingCost: 0.95, demandFactor: 2.0 },
  { name: 'Zumo de naranja 1L', category: 'bebidas', subcategory: 'zumos', basePrice: 2.00, wholesalePrice: 1.55, quality: 55, rarity: 10, manufacturingCost: 1.10, demandFactor: 1.8 },
  { name: 'Zumo de piña 1L', category: 'bebidas', subcategory: 'zumos', basePrice: 2.20, wholesalePrice: 1.70, quality: 50, rarity: 10, manufacturingCost: 1.20, demandFactor: 1.5 },
  { name: 'Cerveza rubia pack 6', category: 'bebidas', subcategory: 'cerveza', basePrice: 4.50, wholesalePrice: 3.50, quality: 55, rarity: 10, manufacturingCost: 2.50, demandFactor: 2.0 },
  { name: 'Cerveza tostada pack 6', category: 'bebidas', subcategory: 'cerveza', basePrice: 5.00, wholesalePrice: 3.90, quality: 60, rarity: 15, manufacturingCost: 2.80, demandFactor: 1.5 },
  { name: 'Vino tinto mesa 75cl', category: 'bebidas', subcategory: 'vino', basePrice: 3.50, wholesalePrice: 2.70, quality: 55, rarity: 15, manufacturingCost: 1.80, demandFactor: 1.5 },
  { name: 'Vino blanco 75cl', category: 'bebidas', subcategory: 'vino', basePrice: 3.50, wholesalePrice: 2.70, quality: 55, rarity: 15, manufacturingCost: 1.80, demandFactor: 1.3 },
  { name: 'Leche batida fresa 200ml', category: 'bebidas', subcategory: 'lacteos', basePrice: 1.20, wholesalePrice: 0.90, quality: 45, rarity: 5, manufacturingCost: 0.65, demandFactor: 1.5 },
  { name: 'Té helado limón 1.5L', category: 'bebidas', subcategory: 'refrescos', basePrice: 1.60, wholesalePrice: 1.25, quality: 40, rarity: 5, manufacturingCost: 0.85, demandFactor: 1.5 },

  // 🧹 LIMPIEZA
  { name: 'Detergente lavadora 2L', category: 'limpieza', subcategory: 'detergentes', basePrice: 4.00, wholesalePrice: 3.10, quality: 55, rarity: 5, manufacturingCost: 2.20, demandFactor: 2.0 },
  { name: 'Suavizante 1L', category: 'limpieza', subcategory: 'detergentes', basePrice: 2.50, wholesalePrice: 1.95, quality: 45, rarity: 5, manufacturingCost: 1.30, demandFactor: 1.8 },
  { name: 'Lejía 2L', category: 'limpieza', subcategory: 'limpiadores', basePrice: 1.50, wholesalePrice: 1.15, quality: 35, rarity: 5, manufacturingCost: 0.75, demandFactor: 2.0 },
  { name: 'Limpiador multiusos 750ml', category: 'limpieza', subcategory: 'limpiadores', basePrice: 2.00, wholesalePrice: 1.55, quality: 50, rarity: 5, manufacturingCost: 1.00, demandFactor: 1.8 },
  { name: 'Limpiador cristales 500ml', category: 'limpieza', subcategory: 'limpiadores', basePrice: 2.20, wholesalePrice: 1.70, quality: 50, rarity: 5, manufacturingCost: 1.10, demandFactor: 1.5 },
  { name: 'Estropajo pack 5', category: 'limpieza', subcategory: 'utensilios', basePrice: 1.50, wholesalePrice: 1.15, quality: 35, rarity: 5, manufacturingCost: 0.75, demandFactor: 1.8 },
  { name: 'Bolsa basura 30uds', category: 'limpieza', subcategory: 'utensilios', basePrice: 2.00, wholesalePrice: 1.55, quality: 40, rarity: 5, manufacturingCost: 1.00, demandFactor: 2.0 },
  { name: 'Papel de cocina pack 3', category: 'limpieza', subcategory: 'papel', basePrice: 2.50, wholesalePrice: 1.95, quality: 45, rarity: 5, manufacturingCost: 1.30, demandFactor: 2.0 },
  { name: 'Papel higiénico pack 12', category: 'limpieza', subcategory: 'papel', basePrice: 5.00, wholesalePrice: 3.90, quality: 50, rarity: 5, manufacturingCost: 2.50, demandFactor: 2.5 },
  { name: 'Ambientador spray 300ml', category: 'limpieza', subcategory: 'ambientadores', basePrice: 2.50, wholesalePrice: 1.95, quality: 45, rarity: 10, manufacturingCost: 1.30, demandFactor: 1.5 },

  // 🐾 MASCOTAS
  { name: 'Pienso perro 5kg', category: 'mascotas', subcategory: 'perros', basePrice: 8.00, wholesalePrice: 6.20, quality: 55, rarity: 5, manufacturingCost: 4.50, demandFactor: 1.8 },
  { name: 'Pienso gato 3kg', category: 'mascotas', subcategory: 'gatos', basePrice: 7.00, wholesalePrice: 5.40, quality: 55, rarity: 5, manufacturingCost: 3.80, demandFactor: 1.8 },
  { name: 'Comida húmeda perro lata 400g', category: 'mascotas', subcategory: 'perros', basePrice: 1.80, wholesalePrice: 1.40, quality: 50, rarity: 5, manufacturingCost: 0.95, demandFactor: 1.5 },
  { name: 'Comida húmeda gato lata 400g', category: 'mascotas', subcategory: 'gatos', basePrice: 1.80, wholesalePrice: 1.40, quality: 50, rarity: 5, manufacturingCost: 0.95, demandFactor: 1.5 },
  { name: 'Arena gato 5kg', category: 'mascotas', subcategory: 'gatos', basePrice: 4.50, wholesalePrice: 3.50, quality: 45, rarity: 5, manufacturingCost: 2.50, demandFactor: 1.5 },
  { name: 'Snacks perro 200g', category: 'mascotas', subcategory: 'perros', basePrice: 2.50, wholesalePrice: 1.95, quality: 50, rarity: 10, manufacturingCost: 1.30, demandFactor: 1.3 },
  { name: 'Juguete pelota perro', category: 'mascotas', subcategory: 'perros', basePrice: 3.00, wholesalePrice: 2.30, quality: 40, rarity: 15, manufacturingCost: 1.50, demandFactor: 1.2 },
  { name: 'Rascador gato pequeño', category: 'mascotas', subcategory: 'gatos', basePrice: 12.00, wholesalePrice: 9.30, quality: 55, rarity: 20, manufacturingCost: 6.50, demandFactor: 1.0 },

  // 💻 ELECTRÓNICA
  { name: 'Cable USB-C 1m', category: 'electronica', subcategory: 'cables', basePrice: 5.00, wholesalePrice: 3.80, quality: 50, rarity: 5, manufacturingCost: 2.50, demandFactor: 1.8 },
  { name: 'Cargador móvil USB', category: 'electronica', subcategory: 'cargadores', basePrice: 8.00, wholesalePrice: 6.20, quality: 50, rarity: 5, manufacturingCost: 4.00, demandFactor: 1.8 },
  { name: 'Auriculares bluetooth', category: 'electronica', subcategory: 'audio', basePrice: 25.00, wholesalePrice: 19.50, quality: 60, rarity: 15, manufacturingCost: 12.00, demandFactor: 1.5 },
  { name: 'Altavoz portátil', category: 'electronica', subcategory: 'audio', basePrice: 30.00, wholesalePrice: 23.00, quality: 65, rarity: 20, manufacturingCost: 15.00, demandFactor: 1.3 },
  { name: 'Ratón inalámbrico', category: 'electronica', subcategory: 'informatica', basePrice: 12.00, wholesalePrice: 9.30, quality: 55, rarity: 10, manufacturingCost: 6.00, demandFactor: 1.5 },
  { name: 'Teclado USB', category: 'electronica', subcategory: 'informatica', basePrice: 15.00, wholesalePrice: 11.60, quality: 55, rarity: 10, manufacturingCost: 7.50, demandFactor: 1.3 },
  { name: 'Webcam HD', category: 'electronica', subcategory: 'informatica', basePrice: 35.00, wholesalePrice: 27.00, quality: 65, rarity: 20, manufacturingCost: 18.00, demandFactor: 1.2 },
  { name: 'Pendrive 64GB', category: 'electronica', subcategory: 'almacenamiento', basePrice: 10.00, wholesalePrice: 7.70, quality: 50, rarity: 10, manufacturingCost: 5.00, demandFactor: 1.5 },
  { name: 'Bombilla LED inteligente', category: 'electronica', subcategory: 'hogar', basePrice: 12.00, wholesalePrice: 9.30, quality: 60, rarity: 20, manufacturingCost: 6.00, demandFactor: 1.2 },
  { name: 'Power bank 10000mAh', category: 'electronica', subcategory: 'baterias', basePrice: 20.00, wholesalePrice: 15.50, quality: 60, rarity: 15, manufacturingCost: 10.00, demandFactor: 1.5 },

  // 🌿 JARDINERÍA
  { name: 'Tierra para plantas 5L', category: 'jardineria', subcategory: 'sustratos', basePrice: 3.00, wholesalePrice: 2.30, quality: 45, rarity: 5, manufacturingCost: 1.50, demandFactor: 1.5 },
  { name: 'Abono universal 1kg', category: 'jardineria', subcategory: 'fertilizantes', basePrice: 4.00, wholesalePrice: 3.10, quality: 50, rarity: 10, manufacturingCost: 2.00, demandFactor: 1.3 },
  { name: 'Maceta cerámica 20cm', category: 'jardineria', subcategory: 'macetas', basePrice: 6.00, wholesalePrice: 4.60, quality: 55, rarity: 10, manufacturingCost: 3.00, demandFactor: 1.5 },
  { name: 'Semillas tomate cherry', category: 'jardineria', subcategory: 'semillas', basePrice: 1.50, wholesalePrice: 1.15, quality: 50, rarity: 10, manufacturingCost: 0.75, demandFactor: 1.2, isSeasonal: true, seasonMonths: [3, 4, 5, 6] },
  { name: 'Semillas lechuga', category: 'jardineria', subcategory: 'semillas', basePrice: 1.20, wholesalePrice: 0.90, quality: 45, rarity: 5, manufacturingCost: 0.60, demandFactor: 1.2, isSeasonal: true, seasonMonths: [2, 3, 4, 5, 9, 10] },
  { name: 'Manguera jardín 15m', category: 'jardineria', subcategory: 'herramientas', basePrice: 12.00, wholesalePrice: 9.30, quality: 55, rarity: 10, manufacturingCost: 6.50, demandFactor: 1.0, isSeasonal: true, seasonMonths: [4, 5, 6, 7, 8] },
  { name: 'Guantes jardinería', category: 'jardineria', subcategory: 'herramientas', basePrice: 6.00, wholesalePrice: 4.60, quality: 50, rarity: 10, manufacturingCost: 3.00, demandFactor: 1.2, isSeasonal: true, seasonMonths: [3, 4, 5, 6, 7, 8] },
  { name: 'Riego por goteo kit', category: 'jardineria', subcategory: 'riego', basePrice: 15.00, wholesalePrice: 11.60, quality: 60, rarity: 20, manufacturingCost: 8.00, demandFactor: 1.0, isSeasonal: true, seasonMonths: [4, 5, 6, 7, 8] },
  { name: 'Planta ornamental pequeña', category: 'jardineria', subcategory: 'plantas', basePrice: 8.00, wholesalePrice: 6.20, quality: 60, rarity: 25, manufacturingCost: 4.00, demandFactor: 1.3 },

  // 💊 FARMACIA (ficticia)
  { name: 'Paracetamol 20 comprimidos', category: 'farmacia', subcategory: 'analgesicos', basePrice: 2.50, wholesalePrice: 1.95, quality: 50, rarity: 5, manufacturingCost: 1.20, demandFactor: 2.0 },
  { name: 'Ibuprofeno 20 comprimidos', category: 'farmacia', subcategory: 'antiinflamatorios', basePrice: 3.00, wholesalePrice: 2.30, quality: 50, rarity: 5, manufacturingCost: 1.50, demandFactor: 2.0 },
  { name: 'Jarabe para la tos 200ml', category: 'farmacia', subcategory: 'resfriado', basePrice: 5.00, wholesalePrice: 3.90, quality: 55, rarity: 10, manufacturingCost: 2.50, demandFactor: 1.5, isSeasonal: true, seasonMonths: [10, 11, 12, 1, 2, 3] },
  { name: 'Vitamina C 30 comprimidos', category: 'farmacia', subcategory: 'vitaminas', basePrice: 4.50, wholesalePrice: 3.50, quality: 55, rarity: 10, manufacturingCost: 2.20, demandFactor: 1.5 },
  { name: 'Complejo vitamínico B', category: 'farmacia', subcategory: 'vitaminas', basePrice: 7.00, wholesalePrice: 5.40, quality: 60, rarity: 15, manufacturingCost: 3.50, demandFactor: 1.2 },
  { name: 'Protector solar SPF30', category: 'farmacia', subcategory: 'cuidado_solar', basePrice: 8.00, wholesalePrice: 6.20, quality: 60, rarity: 15, manufacturingCost: 4.00, demandFactor: 2.0, isSeasonal: true, seasonMonths: [5, 6, 7, 8, 9] },
  { name: 'Crema hidratante facial 50ml', category: 'farmacia', subcategory: 'cuidado_piel', basePrice: 6.00, wholesalePrice: 4.60, quality: 55, rarity: 10, manufacturingCost: 3.00, demandFactor: 1.5 },
  { name: 'Gel hidroalcohólico 250ml', category: 'farmacia', subcategory: 'higiene', basePrice: 2.00, wholesalePrice: 1.55, quality: 40, rarity: 5, manufacturingCost: 1.00, demandFactor: 1.8 },
  { name: 'Tiritas pack 50', category: 'farmacia', subcategory: 'primeros_auxilios', basePrice: 1.50, wholesalePrice: 1.15, quality: 40, rarity: 5, manufacturingCost: 0.70, demandFactor: 1.8 },
  { name: 'Pastillas menta 50g', category: 'farmacia', subcategory: 'salud_bucal', basePrice: 1.20, wholesalePrice: 0.90, quality: 35, rarity: 5, manufacturingCost: 0.55, demandFactor: 1.5 },

  // 👕 MODA
  { name: 'Camiseta básica algodón', category: 'moda', subcategory: 'ropa', basePrice: 8.00, wholesalePrice: 6.20, quality: 50, rarity: 5, manufacturingCost: 4.00, demandFactor: 1.8 },
  { name: 'Calcetines pack 3', category: 'moda', subcategory: 'ropa', basePrice: 5.00, wholesalePrice: 3.90, quality: 45, rarity: 5, manufacturingCost: 2.50, demandFactor: 1.8 },
  { name: 'Bufanda lana', category: 'moda', subcategory: 'ropa', basePrice: 10.00, wholesalePrice: 7.70, quality: 55, rarity: 15, manufacturingCost: 5.00, demandFactor: 1.2, isSeasonal: true, seasonMonths: [10, 11, 12, 1, 2, 3] },
  { name: 'Gorra básica', category: 'moda', subcategory: 'accesorios', basePrice: 6.00, wholesalePrice: 4.60, quality: 45, rarity: 10, manufacturingCost: 3.00, demandFactor: 1.3 },
  { name: 'Mochila escolar', category: 'moda', subcategory: 'accesorios', basePrice: 20.00, wholesalePrice: 15.50, quality: 55, rarity: 10, manufacturingCost: 10.00, demandFactor: 1.5 },
  { name: 'Zapatillas deportivas', category: 'moda', subcategory: 'calzado', basePrice: 35.00, wholesalePrice: 27.00, quality: 60, rarity: 15, manufacturingCost: 18.00, demandFactor: 1.5 },
  { name: 'Pantalón vaquero', category: 'moda', subcategory: 'ropa', basePrice: 25.00, wholesalePrice: 19.50, quality: 60, rarity: 10, manufacturingCost: 13.00, demandFactor: 1.5 },
  { name: 'Chaqueta impermeable', category: 'moda', subcategory: 'ropa', basePrice: 40.00, wholesalePrice: 31.00, quality: 65, rarity: 20, manufacturingCost: 20.00, demandFactor: 1.2, isSeasonal: true, seasonMonths: [9, 10, 11, 12, 1, 2, 3, 4] },

  // 🎮 JUGUETES
  { name: 'Muñeca articulada', category: 'juguetes', subcategory: 'muñecas', basePrice: 15.00, wholesalePrice: 11.60, quality: 55, rarity: 10, manufacturingCost: 7.00, demandFactor: 1.5 },
  { name: 'Coche teledirigido', category: 'juguetes', subcategory: 'vehiculos', basePrice: 25.00, wholesalePrice: 19.50, quality: 55, rarity: 15, manufacturingCost: 12.00, demandFactor: 1.3 },
  { name: 'Puzzle 500 piezas', category: 'juguetes', subcategory: 'mesa', basePrice: 12.00, wholesalePrice: 9.30, quality: 55, rarity: 15, manufacturingCost: 5.50, demandFactor: 1.2 },
  { name: 'Pelota fútbol tamaño 5', category: 'juguetes', subcategory: 'deportes', basePrice: 15.00, wholesalePrice: 11.60, quality: 55, rarity: 10, manufacturingCost: 7.00, demandFactor: 1.5 },
  { name: 'Juego construcción 200pzs', category: 'juguetes', subcategory: 'construccion', basePrice: 20.00, wholesalePrice: 15.50, quality: 60, rarity: 10, manufacturingCost: 9.00, demandFactor: 1.5 },
  { name: 'Peluche osito 30cm', category: 'juguetes', subcategory: 'peluches', basePrice: 12.00, wholesalePrice: 9.30, quality: 55, rarity: 10, manufacturingCost: 5.50, demandFactor: 1.5 },
  { name: 'Carta Magic Pack', category: 'juguetes', subcategory: 'cartas', basePrice: 4.00, wholesalePrice: 3.10, quality: 40, rarity: 20, manufacturingCost: 1.80, demandFactor: 1.8 },
  { name: 'Set plastilina 10 colores', category: 'juguetes', subcategory: 'manualidades', basePrice: 6.00, wholesalePrice: 4.60, quality: 45, rarity: 5, manufacturingCost: 2.50, demandFactor: 1.3 },
  { name: 'Tren de madera', category: 'juguetes', subcategory: 'primera_infancia', basePrice: 22.00, wholesalePrice: 17.00, quality: 65, rarity: 20, manufacturingCost: 11.00, demandFactor: 1.2 },
  { name: 'Cartas UNO', category: 'juguetes', subcategory: 'cartas', basePrice: 8.00, wholesalePrice: 6.20, quality: 50, rarity: 10, manufacturingCost: 3.50, demandFactor: 1.5 }
];

const brands = ['MarcaPremium', 'EcoSelect', 'QualityFirst', 'BestChoice', 'FreshMarket',
  'SuperValue', 'DailyGoods', 'NaturePure', 'HomeEssentials', 'SmartBuy'];

async function seed() {
  try {
    // Direct connection to Atlas primary for seeding
    const uri = 'mongodb://junta_db_user:1gQKARcW4PYdbpnO@ac-pysrurk-shard-00-01.yg22wfb.mongodb.net:27017/supermarket-simulator?ssl=true&authSource=admin&directConnection=true&serverSelectionTimeoutMS=10000';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Clear existing products
    const deleted = await Product.deleteMany({ isWhiteLabel: false });
    console.log(`Deleted ${deleted.deletedCount} existing products`);

    // Assign brands
    const seeded = await Product.insertMany(
      products.map((p, i) => ({
        ...p,
        brand: brands[i % brands.length],
        imageUrl: `product-${p.category}-${(i % 10) + 1}.png`,
        tax: p.category === 'alimentacion' ? 0.10 : 0.21,
        isActive: true
      }))
    );

    console.log(`Seeded ${seeded.length} products`);
    console.log('Categories:');
    const categories = [...new Set(seeded.map(p => p.category))];
    for (const cat of categories) {
      const count = seeded.filter(p => p.category === cat).length;
      console.log(`  ${cat}: ${count} products`);
    }

    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
