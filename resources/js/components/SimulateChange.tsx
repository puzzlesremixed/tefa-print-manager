import { Button } from '@/components/ui/button';
import SimulateChangeModal from '@/components/ui/simulate-change-modal';
import { simulatePayment } from '@/routes/printJob';
import { PrintJob } from '@/types/data';
import { router } from '@inertiajs/react';
import { Coins, Wallet } from 'lucide-react';
import { useState } from 'react';
import { DropdownMenuItem } from './ui/dropdown-menu';

export function SimulateChangeContainer({
  printJob,
  type,
}: {
  printJob: PrintJob;
  type?: 'table' | 'context';
}) {
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

  if (type === 'context') {
    return (
      <>
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            setIsModalOpen(true);
          }}
        >
          <Wallet className="h-4 w-4" />
          Give change
        </DropdownMenuItem>

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

  return (
    <>
      <Button
        className="cursor-pointer"
        variant={'secondary'}
        onClick={() => setIsModalOpen(true)}
      >
        <Coins className="mr-1 h-4 w-4" />
        Change
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
