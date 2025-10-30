import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X } from 'lucide-react';

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VoucherModal({ isOpen, onClose }: VoucherModalProps) {
  const [voucherCode, setVoucherCode] = useState('');

  const handleNumberClick = (number: string) => {
    if (voucherCode.length < 4) {
      setVoucherCode(prev => prev + number);
    }
  };

  const handleClear = () => {
    setVoucherCode('');
  };

  const handleBackspace = () => {
    setVoucherCode(prev => prev.slice(0, -1));
  };

  const handleAccept = () => {
    console.log('Voucher aceito:', voucherCode);
    // Implementar lógica de aceitação
    onClose();
  };

  const handleUseVoucher = () => {
    console.log('Utilizando voucher:', voucherCode);
    // Implementar lógica de utilização
    onClose();
  };

  const numbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫']
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-none shadow-2xl" aria-describedby="voucher-description">
        <div className="relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <DialogHeader className="text-center pb-6">
            <DialogTitle className="text-xl text-blue-600 font-medium">
              Voucher
            </DialogTitle>
            <DialogDescription id="voucher-description">
              Digite o código de 4 dígitos do seu voucher para acessar sua refeição
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Input Display */}
            <div className="relative">
              <Input
                value={voucherCode}
                readOnly
                placeholder="Digite o código do voucher (4 dígitos)"
                className="text-center text-lg bg-gray-50 border-gray-200 h-12 text-gray-800"
              />
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
              {numbers.flat().map((num, index) => (
                <div key={index}>
                  {num === '' ? (
                    <div className="h-12" />
                  ) : num === '⌫' ? (
                    <Button
                      variant="outline"
                      className="h-12 w-full border-gray-300 text-gray-600 hover:bg-gray-50 text-lg"
                      onClick={handleBackspace}
                    >
                      {num}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="h-12 w-full border-gray-300 text-gray-800 hover:bg-gray-50 text-lg font-medium"
                      onClick={() => handleNumberClick(num)}
                    >
                      {num}
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleAccept}
                className="w-full bg-red-500 hover:bg-red-600 text-white h-12 text-base font-medium"
                disabled={!voucherCode}
              >
                Aceitar
              </Button>
              <Button
                onClick={handleUseVoucher}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium"
                disabled={!voucherCode}
              >
                Utilizar Voucher
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}