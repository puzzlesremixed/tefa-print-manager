import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

interface SimulateChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  givenAmount: string;
  onGivenAmountChange: (value: string) => void;
  price: number;
  changeAmount: number;
  onConfirm: () => void;
  isConfirmDisabled: boolean;
}

export default function SimulateChangeModal({
  isOpen,
  onClose,
  givenAmount,
  onGivenAmountChange,
  price,
  changeAmount,
  onConfirm,
  isConfirmDisabled
}: SimulateChangeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Simulasi Kembalian</DialogTitle>
          <DialogDescription>
            Masukkan nominal uang yang diberikan customer
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="givenAmount" className="text-right">
              Nominal Uang
            </Label>
            <Input
              id="givenAmount"
              type="number"
              value={givenAmount}
              onChange={(e) => onGivenAmountChange(e.target.value)}
              className="col-span-3"
              placeholder="Contoh: 20000"
              autoFocus
            />
          </div>

          {givenAmount && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">
                  Harga
                </Label>
                <div className="col-span-3 font-medium">
                  Rp {price.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">
                  Kembalian
                </Label>
                <div className="col-span-3 font-bold text-green-600">
                  Rp {changeAmount.toLocaleString('id-ID')}
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={onConfirm} disabled={isConfirmDisabled}>
            Konfirmasi Pembayaran
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}