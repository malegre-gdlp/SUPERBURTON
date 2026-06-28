const products = [
  // 🍎 ALIMENTACIÓN
  { name: 'Arroz blanco 1kg', category: 'alimentacion', subcategory: 'arroz', basePrice: 1.20, wholesalePrice: 0.95, quality: 45, rarity: 5, manufacturingCost: 0.70, demandFactor: 2.0 },
  { name: 'Arroz integral 1kg', category: 'alimentacion', subcategory: 'arroz', basePrice: 1.80, wholesalePrice: 1.40, quality: 55, rarity: 10, manufacturingCost: 1.00, demandFactor: 1.5 },
  { name: 'Pasta espagueti 500g', category: 'alimentacion', subcategory: 'pasta', basePrice: 0.90, wholesalePrice: 0.70, quality: 40, rarity: 5, manufacturingCost: 0.50, demandFactor: 2.0 },
  { name: 'Aceite oliva virgen extra 1L', category: 'alimentacion', subcategory: 'aceite', basePrice: 4.50, wholesalePrice: 3.50, quality: 70, rarity: 15, manufacturingCost: 2.80, demandFactor: 1.5 },
  { name: 'Aceite girasol 1L', category: 'alimentacion', subcategory: 'aceite', basePrice: 1.80, wholesalePrice: 1.40, quality: 35, rarity: 5, manufacturingCost: 1.10, demandFactor: 2.0 },
  { name: 'Harina trigo 1kg', category: 'alimentacion', subcategory: 'harina', basePrice: 0.80, wholesalePrice: 0.60, quality: 35, rarity: 5, manufacturingCost: 0.45, demandFactor: 1.8 },
  { name: 'Azúcar blanco 1kg', category: 'alimentacion', subcategory: 'azucar', basePrice: 1.00, wholesalePrice: 0.75, quality: 35, rarity: 5, manufacturingCost: 0.55, demandFactor: 1.9 },
  { name: 'Sal fina 1kg', category: 'alimentacion', subcategory: 'sal', basePrice: 0.60, wholesalePrice: 0.45, quality: 30, rarity: 5, manufacturingCost: 0.35, demandFactor: 1.5 },
  { name: 'Tomate frito 400g', category: 'alimentacion', subcategory: 'conservas', basePrice: 1.50, wholesalePrice: 1.10, quality: 50, rarity: 5, manufacturingCost: 0.85, demandFactor: 2.0 },
  { name: 'Atún lata 120g', category: 'alimentacion', subcategory: 'conservas', basePrice: 1.80, wholesalePrice: 1.35, quality: 55, rarity: 10, manufacturingCost: 1.00, demandFactor: 2.0 },
  { name: 'Garbanzos cocidos 400g', category: 'alimentacion', subcategory: 'conservas', basePrice: 1.20, wholesalePrice: 0.90, quality: 45, rarity: 5, manufacturingCost: 0.65, demandFactor: 1.5 },
  { name: 'Lentejas cocidas 400g', category: 'alimentacion', subcategory: 'conservas', basePrice: 1.15, wholesalePrice: 0.85, quality: 45, rarity: 5, manufacturingCost: 0.65, demandFactor: 1.5 },
  { name: 'Pan de molde 500g', category: 'alimentacion', subcategory: 'pan', basePrice: 2.00, wholesalePrice: 1.50, quality: 50, rarity: 5, manufacturingCost: 1.10, demandFactor: 2.0 },
  { name: 'Leche entera 1L', category: 'alimentacion', subcategory: 'lacteos', basePrice: 0.95, wholesalePrice: 0.75, quality: 50, rarity: 5, manufacturingCost: 0.50, demandFactor: 2.5 },
  { name: 'Yogur natural pack 4', category: 'alimentacion', subcategory: 'lacteos', basePrice: 1.80, wholesalePrice: 1.40, quality: 55, rarity: 5, manufacturingCost: 0.90, demandFactor: 2.0 },
  { name: 'Queso curado 200g', category: 'alimentacion', subcategory: 'lacteos', basePrice: 3.50, wholesalePrice: 2.70, quality: 75, rarity: 15, manufacturingCost: 2.00, demandFactor: 1.2 },
  { name: 'Huevos docena', category: 'alimentacion', subcategory: 'huevos', basePrice: 2.20, wholesalePrice: 1.70, quality: 60, rarity: 5, manufacturingCost: 1.20, demandFactor: 2.2 },
  { name: 'Cereales integrales 500g', category: 'alimentacion', subcategory: 'cereales', basePrice: 2.50, wholesalePrice: 1.90, quality: 55, rarity: 10, manufacturingCost: 1.20, demandFactor: 1.5 },
  { name: 'Galletas María 400g', category: 'alimentacion', subcategory: 'galletas', basePrice: 1.20, wholesalePrice: 0.90, quality: 40, rarity: 5, manufacturingCost: 0.55, demandFactor: 1.8 },
  { name: 'Mermelada fresa 350g', category: 'alimentacion', subcategory: 'mermeladas', basePrice: 1.60, wholesalePrice: 1.20, quality: 50, rarity: 8, manufacturingCost: 0.80, demandFactor: 1.2 },
  { name: 'Cacao soluble 400g', category: 'alimentacion', subcategory: 'cacao', basePrice: 2.20, wholesalePrice: 1.70, quality: 55, rarity: 10, manufacturingCost: 1.00, demandFactor: 1.3 },
  // 🥤 BEBIDAS
  { name: 'Agua mineral 1.5L', category: 'bebidas', subcategory: 'agua', basePrice: 0.50, wholesalePrice: 0.35, quality: 40, rarity: 5, manufacturingCost: 0.15, demandFactor: 2.5 },
  { name: 'Refresco cola 2L', category: 'bebidas', subcategory: 'refrescos', basePrice: 1.30, wholesalePrice: 1.00, quality: 50, rarity: 5, manufacturingCost: 0.30, demandFactor: 2.0 },
  { name: 'Zumo naranja 1L', category: 'bebidas', subcategory: 'zumos', basePrice: 1.60, wholesalePrice: 1.20, quality: 55, rarity: 8, manufacturingCost: 0.70, demandFactor: 1.5 },
  { name: 'Cerveza rubia pack 6', category: 'bebidas', subcategory: 'cerveza', basePrice: 3.50, wholesalePrice: 2.70, quality: 55, rarity: 10, manufacturingCost: 1.50, demandFactor: 1.6 },
  { name: 'Vino tinto mesa 750ml', category: 'bebidas', subcategory: 'vino', basePrice: 3.00, wholesalePrice: 2.30, quality: 60, rarity: 12, manufacturingCost: 1.50, demandFactor: 1.2 },
  { name: 'Leche almendras 1L', category: 'bebidas', subcategory: 'vegetales', basePrice: 2.20, wholesalePrice: 1.70, quality: 55, rarity: 12, manufacturingCost: 1.20, demandFactor: 1.3 },
  { name: 'Té verde 20 bolsitas', category: 'bebidas', subcategory: 'tes', basePrice: 1.90, wholesalePrice: 1.50, quality: 65, rarity: 10, manufacturingCost: 0.80, demandFactor: 1.2 },
  { name: 'Café molido 250g', category: 'bebidas', subcategory: 'cafe', basePrice: 3.00, wholesalePrice: 2.40, quality: 70, rarity: 12, manufacturingCost: 1.60, demandFactor: 1.5 },
  { name: 'Bebida energética 330ml', category: 'bebidas', subcategory: 'energeticas', basePrice: 2.50, wholesalePrice: 1.90, quality: 40, rarity: 10, manufacturingCost: 0.50, demandFactor: 1.4 },
  // 🧹 LIMPIEZA
  { name: 'Detergente líquido 1L', category: 'limpieza', subcategory: 'ropa', basePrice: 3.00, wholesalePrice: 2.40, quality: 50, rarity: 5, manufacturingCost: 1.50, demandFactor: 1.8 },
  { name: 'Suavizante 1L', category: 'limpieza', subcategory: 'ropa', basePrice: 2.20, wholesalePrice: 1.70, quality: 45, rarity: 5, manufacturingCost: 1.00, demandFactor: 1.5 },
  { name: 'Lejía 2L', category: 'limpieza', subcategory: 'desinfectantes', basePrice: 1.20, wholesalePrice: 0.90, quality: 40, rarity: 5, manufacturingCost: 0.50, demandFactor: 1.6 },
  { name: 'Limpiacristales 500ml', category: 'limpieza', subcategory: 'cristales', basePrice: 1.80, wholesalePrice: 1.40, quality: 50, rarity: 8, manufacturingCost: 0.80, demandFactor: 1.2 },
  { name: 'Fregasuelos 1L', category: 'limpieza', subcategory: 'suelos', basePrice: 2.00, wholesalePrice: 1.60, quality: 45, rarity: 5, manufacturingCost: 0.90, demandFactor: 1.4 },
  { name: 'Lavavajillas 500ml', category: 'limpieza', subcategory: 'cocina', basePrice: 2.50, wholesalePrice: 1.90, quality: 50, rarity: 5, manufacturingCost: 1.10, demandFactor: 1.5 },
  { name: 'Papel higiénico pack 4', category: 'limpieza', subcategory: 'papel', basePrice: 2.40, wholesalePrice: 1.80, quality: 45, rarity: 5, manufacturingCost: 1.00, demandFactor: 2.2 },
  // 🐾 MASCOTAS
  { name: 'Pienso perro 2kg', category: 'mascotas', subcategory: 'perros', basePrice: 5.50, wholesalePrice: 4.20, quality: 50, rarity: 5, manufacturingCost: 2.80, demandFactor: 1.6 },
  { name: 'Pienso gato 2kg', category: 'mascotas', subcategory: 'gatos', basePrice: 5.00, wholesalePrice: 3.80, quality: 50, rarity: 5, manufacturingCost: 2.50, demandFactor: 1.5 },
  { name: 'Comida húmeda perro lata', category: 'mascotas', subcategory: 'perros', basePrice: 1.20, wholesalePrice: 0.90, quality: 45, rarity: 5, manufacturingCost: 0.50, demandFactor: 1.4 },
  { name: 'Arena gato 5kg', category: 'mascotas', subcategory: 'gatos', basePrice: 3.00, wholesalePrice: 2.30, quality: 40, rarity: 5, manufacturingCost: 1.20, demandFactor: 1.4 },
  // 💻 ELECTRÓNICA
  { name: 'Auriculares bluetooth', category: 'electronica', subcategory: 'audio', basePrice: 15.00, wholesalePrice: 11.00, quality: 55, rarity: 15, manufacturingCost: 7.00, demandFactor: 1.3 },
  { name: 'Cargador USB-C', category: 'electronica', subcategory: 'accesorios', basePrice: 8.00, wholesalePrice: 6.00, quality: 50, rarity: 10, manufacturingCost: 3.00, demandFactor: 1.6 },
  { name: 'Power bank 10000mAh', category: 'electronica', subcategory: 'baterias', basePrice: 20.00, wholesalePrice: 15.00, quality: 60, rarity: 15, manufacturingCost: 10.00, demandFactor: 1.3 },
  { name: 'Ratón inalámbrico', category: 'electronica', subcategory: 'informatica', basePrice: 12.00, wholesalePrice: 9.00, quality: 55, rarity: 12, manufacturingCost: 5.00, demandFactor: 1.2 },
  // 🌿 JARDINERÍA
  { name: 'Tierra macetas 5L', category: 'jardineria', subcategory: 'suelos', basePrice: 2.50, wholesalePrice: 1.90, quality: 45, rarity: 5, manufacturingCost: 1.00, demandFactor: 1.3 },
  { name: 'Maceta barro 15cm', category: 'jardineria', subcategory: 'macetas', basePrice: 3.00, wholesalePrice: 2.30, quality: 50, rarity: 5, manufacturingCost: 1.50, demandFactor: 1.1 },
  { name: 'Abono orgánico 1kg', category: 'jardineria', subcategory: 'fertilizantes', basePrice: 4.00, wholesalePrice: 3.00, quality: 55, rarity: 10, manufacturingCost: 2.00, demandFactor: 1.2 },
  { name: 'Semillas tomate', category: 'jardineria', subcategory: 'semillas', basePrice: 1.50, wholesalePrice: 1.10, quality: 50, rarity: 8, manufacturingCost: 0.50, demandFactor: 1.1 },
  // 💊 FARMACIA (ficticia)
  { name: 'Paracetamol 500mg 20ud', category: 'farmacia', subcategory: 'analgesicos', basePrice: 2.50, wholesalePrice: 1.90, quality: 55, rarity: 8, manufacturingCost: 1.00, demandFactor: 1.6 },
  { name: 'Ibuprofeno 400mg 20ud', category: 'farmacia', subcategory: 'analgesicos', basePrice: 3.00, wholesalePrice: 2.30, quality: 55, rarity: 8, manufacturingCost: 1.20, demandFactor: 1.5 },
  { name: 'Vitamina C 30comp', category: 'farmacia', subcategory: 'vitaminas', basePrice: 4.50, wholesalePrice: 3.50, quality: 60, rarity: 10, manufacturingCost: 2.00, demandFactor: 1.3 },
  { name: 'Jabón manos 500ml', category: 'farmacia', subcategory: 'higiene', basePrice: 1.50, wholesalePrice: 1.10, quality: 45, rarity: 5, manufacturingCost: 0.60, demandFactor: 1.8 },
  { name: 'Champú 400ml', category: 'farmacia', subcategory: 'higiene', basePrice: 2.80, wholesalePrice: 2.10, quality: 50, rarity: 5, manufacturingCost: 1.20, demandFactor: 1.6 },
  { name: 'Pasta dental 100ml', category: 'farmacia', subcategory: 'higiene', basePrice: 2.00, wholesalePrice: 1.50, quality: 50, rarity: 5, manufacturingCost: 0.80, demandFactor: 1.7 },
  // 👕 MODA
  { name: 'Camiseta algodón', category: 'moda', subcategory: 'ropa', basePrice: 8.00, wholesalePrice: 6.00, quality: 50, rarity: 5, manufacturingCost: 3.50, demandFactor: 1.5 },
  { name: 'Pantalón vaquero', category: 'moda', subcategory: 'ropa', basePrice: 25.00, wholesalePrice: 19.00, quality: 60, rarity: 10, manufacturingCost: 12.00, demandFactor: 1.3 },
  { name: 'Calcetines pack 3', category: 'moda', subcategory: 'ropa', basePrice: 4.00, wholesalePrice: 3.00, quality: 45, rarity: 5, manufacturingCost: 1.50, demandFactor: 1.6 },
  // 🎮 JUGUETES
  { name: 'Pelota fútbol', category: 'juguetes', subcategory: 'deportes', basePrice: 10.00, wholesalePrice: 7.50, quality: 50, rarity: 8, manufacturingCost: 4.00, demandFactor: 1.3 },
  { name: 'Muñeca articulada', category: 'juguetes', subcategory: 'muñecas', basePrice: 15.00, wholesalePrice: 11.00, quality: 55, rarity: 10, manufacturingCost: 6.00, demandFactor: 1.2 },
  { name: 'Coche teledirigido', category: 'juguetes', subcategory: 'vehiculos', basePrice: 22.00, wholesalePrice: 16.50, quality: 55, rarity: 15, manufacturingCost: 10.00, demandFactor: 1.1 },
  { name: 'Puzzle 500 piezas', category: 'juguetes', subcategory: 'mesa', basePrice: 12.00, wholesalePrice: 9.00, quality: 60, rarity: 8, manufacturingCost: 5.00, demandFactor: 1.1 },
  { name: 'Construcción 100pz', category: 'juguetes', subcategory: 'construccion', basePrice: 14.00, wholesalePrice: 10.50, quality: 55, rarity: 10, manufacturingCost: 6.00, demandFactor: 1.3 },
];

const brands = ['MarcaPremium', 'EcoSelect', 'QualityFirst', 'BestChoice', 'FreshMarket',
  'SuperValue', 'DailyGoods', 'NaturePure', 'HomeEssentials', 'SmartBuy'];

module.exports = { products, brands };
