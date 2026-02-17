import { Button } from '@/components/ui/button';
import SimulateChangeModal from '@/components/ui/simulate-change-modal';
import { simulatePayment } from '@/routes/printJob';
import { PrintJob } from '@/types/data';
import { router } from '@inertiajs/react';
import { Wallet } from 'lucide-react';
import { useState } from 'react';

export function SimulateChangeContainer({ printJob }: { printJob: PrintJob }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [givenAmount, setGivenAmount] = useState('');

  const price = printJob.total_price || 0;
  const changeAmount = givenAmount
    ? Math.max(0, parseInt(givenAmount) - price)
    : 0;
  const isConfirmDisabled = !givenAmount || parseInt(givenAmount) < price;

  const handleGivenAmountChange = (value: string) => {
    setGivenAmount(value);
  };

  const handleConfirmPayment = () => {
    router.visit(simulatePayment(printJob.id.toString()), {
      preserveState: true,
    });
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        className="cursor-pointer"
        variant={'secondary'}
        onClick={() => setIsModalOpen(true)}
      >
        <Wallet className="mr-1 h-4 w-4" />
        Kembalian
      </Button>

      <SimulateChangeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        givenAmount={givenAmount}
        onGivenAmountChange={handleGivenAmountChange}
        price={price}
        changeAmount={changeAmount}
        onConfirm={handleConfirmPayment}
        isConfirmDisabled={isConfirmDisabled}
      />
    </>
  );
}
