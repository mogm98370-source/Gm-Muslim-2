const fs = require('fs');
let code = fs.readFileSync('src/components/inventory/Inventory.tsx', 'utf8');

code = code.replace(
  "if (item.type === 'frame') updateData.activeFrame = item.productId; updateData.activeFrameName = item.name;",
  "if (item.type === 'frame') { updateData.activeFrame = item.productId; updateData.activeFrameName = item.name; }"
);
code = code.replace(
  "if (item.type === 'badge') updateData.activeBadge = item.productId; updateData.activeBadgeName = item.name;",
  "if (item.type === 'badge') { updateData.activeBadge = item.productId; updateData.activeBadgeName = item.name; }"
);
code = code.replace(
  "if (item.type === 'name_style') updateData.activeNameStyle = item.productId; updateData.activeNameStyleName = item.name;",
  "if (item.type === 'name_style') { updateData.activeNameStyle = item.productId; updateData.activeNameStyleName = item.name; }"
);
code = code.replace(
  "if (item.type === 'effect') updateData.activeEffect = item.productId; updateData.activeEffectName = item.name;",
  "if (item.type === 'effect') { updateData.activeEffect = item.productId; updateData.activeEffectName = item.name; }"
);

fs.writeFileSync('src/components/inventory/Inventory.tsx', code);
