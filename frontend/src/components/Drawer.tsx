import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  mobileOnly?: boolean;
}

const DRAG_CLOSE_THRESHOLD = 80;

export function Drawer({ open, onClose, title, children, mobileOnly = true }: DrawerProps) {
  const dragControls = useDragControls();

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="drawer-backdrop"
            className={`fixed inset-0 z-[1200] bg-black/60 ${mobileOnly ? 'lg:hidden' : ''}`}
            style={{ backdropFilter: 'blur(2px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            key="drawer-panel"
            className={`fixed inset-x-0 bottom-0 z-[1210] bg-white rounded-t-2xl shadow-2xl max-h-[85dvh] flex flex-col touch-pan-y ${mobileOnly ? 'lg:hidden' : ''}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > DRAG_CLOSE_THRESHOLD || info.velocity.y > 300) {
                onClose();
              }
            }}
          >
            <div
              className="flex justify-center pt-2 pb-1 shrink-0 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={(e) => dragControls.start(e)}
              style={{ touchAction: 'none' }}
            >
              <div className="w-12 h-1 rounded-full bg-gray-300" aria-hidden />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
              <h2 id="drawer-title" className="text-lg font-bold text-neutral-800">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
