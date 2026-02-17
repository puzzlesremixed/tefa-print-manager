import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
          <DialogTitle>Pay With Change</DialogTitle>
          <DialogDescription>
            Enter the amount of money given by the customer for the change calculation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="givenAmount" className="text-right">
              Amount
            </Label>
            <Input
              id="givenAmount"
              type="number"
              value={givenAmount}
              onChange={(e) => onGivenAmountChange(e.target.value)}
              className="col-span-3"
              placeholder="Ex: 20000"
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
                  Change
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
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isConfirmDisabled}>
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}