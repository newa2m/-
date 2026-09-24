import React from 'react';
import {
  Boxes,
  Warehouse,
  HardHat,
  PaintRoller,
  Wrench,
  ShoppingCart,
  ClipboardList,
  Truck,
  Layers,
  CheckCircle2,
  Cpu,
  Archive,
  Folder
} from 'lucide-react';

interface ListIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const ListIcon: React.FC<ListIconProps> = ({ name, className = 'w-5 h-5', size }) => {
  const props = { className, size };

  switch (name) {
    case 'boxes':
      return <Boxes {...props} />;
    case 'warehouse':
      return <Warehouse {...props} />;
    case 'hard-hat':
      return <HardHat {...props} />;
    case 'paint-roller':
      return <PaintRoller {...props} />;
    case 'wrench':
      return <Wrench {...props} />;
    case 'shopping-cart':
      return <ShoppingCart {...props} />;
    case 'clipboard-list':
      return <ClipboardList {...props} />;
    case 'truck':
      return <Truck {...props} />;
    case 'layers':
      return <Layers {...props} />;
    case 'check-circle-2':
      return <CheckCircle2 {...props} />;
    case 'cpu':
      return <Cpu {...props} />;
    case 'archive':
      return <Archive {...props} />;
    default:
      return <Folder {...props} />;
  }
};
