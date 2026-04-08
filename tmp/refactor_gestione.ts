import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/pages/Gestione.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add ProductManager import
if (!content.includes("import ProductManager from '../components/gestione/ProductManager';")) {
  content = content.replace(
    "import MenuManager from '../components/gestione/MenuManager';",
    "import MenuManager from '../components/gestione/MenuManager';\nimport ProductManager from '../components/gestione/ProductManager';"
  );
}

// 2. Remove states
content = content.replace(/const \[editingProduct, setEditingProduct\] = useState<Partial<Product> \| null>\(null\);\s*/, '');
content = content.replace(/const \[isUploading, setIsUploading\] = useState\(false\);\s*/, '');
content = content.replace(/const \[selectedMacroCategory, setSelectedMacroCategory\] = useState<string \| null>\(null\);\s*/, '');
content = content.replace(/const \[expandedSubCats, setExpandedSubCats\] = useState<Record<string, boolean>>\(\{\}\);\s*/, '');
content = content.replace(/const \[openContextProductId, setOpenContextProductId\] = useState<string \| null>\(null\);\s*/, '');


// 3. Remove handlers
content = content.replace(/const handleSaveProduct = async \(\) => \{[\s\S]*?fetchData\(\);\n  };\n\n/g, '');
content = content.replace(/const handleDeleteProduct = async \(id: string\) => \{[\s\S]*?fetchData\(\);\n  };\n\n/g, '');
content = content.replace(/const handleToggleProductActive = async \(product: Product\) => \{[\s\S]*?info'\);\n  };\n\n/g, '');
content = content.replace(/const handleDeleteCategory = async \(id: string\) => \{[\s\S]*?fetchData\(\);\n  };\n\n/g, '');
content = content.replace(/const handleDeleteMacroCategory = async \(macroName: string\) => \{[\s\S]*?\}\n  };\n\n/g, '');
content = content.replace(/const handleMoveProduct = async \(product: Product, direction: 'up' \| 'down'\) => \{[\s\S]*?fetchData\(\);\n    \}\n  };\n\n/g, '');
content = content.replace(/const handleMoveCategory = async \(category: Category, direction: 'up' \| 'down'\) => \{[\s\S]*?\]\);\n  };\n\n/g, '');

content = content.replace(/\/\/ Opens the ImageCropperModal with the selected file\s*const openCropper = \(file: File, aspect: number, callback: \(base64: string\) => void\) => \{[\s\S]*?reader\.readAsDataURL\(file\);\n  };\n\n/g, '');
content = content.replace(/\/\/ Opens the file picker \+ crops with modal \(for category images used inside settings\)\s*const handleImageUpload = async \(e: React\.ChangeEvent<HTMLInputElement>, callback: \(base64: string\) => void, aspect\?: number\) => \{[\s\S]*?reader\.readAsDataURL\(file\);\n    \}\n  };\n\n/g, '');

// 4. Update handleBack
content = content.replace(/if \(editingProduct \|\| editingMenu\) \{/, 'if (editingMenu) {');
content = content.replace(/setEditingProduct\(null\);\s+/, '');
content = content.replace(/\|\| editingProduct/g, '');

// 5. Replace block
const startMarker = "{activeTab === 'products' && productView === 'listino' && (";
const endMarker = "</div>\n          )}\n\n          {activeTab === 'menus'";
const idxStart = content.indexOf(startMarker);
const idxEnd = content.indexOf(endMarker);

if (idxStart !== -1 && idxEnd !== -1) {
  const replacement = `{activeTab === 'products' && productView === 'listino' && (
            <ProductManager
              restaurantId={restaurantId}
              categories={categories}
              products={products}
              onRefresh={fetchData}
              onBack={() => setProductView('hub')}
            />
          )}\n\n          {activeTab === 'menus'`;
  
  content = content.substring(0, idxStart) + replacement + content.substring(idxEnd + endMarker.length);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Gestione.tsx refactored successfully.');
