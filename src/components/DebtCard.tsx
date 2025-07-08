'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

interface Debt {
  id: string;
  type: string;
  amount: number;
  remainingAmount: number;
  interestRate: number;
  duration: number;
  amortizationType: string;
  startDate: string;
  lender: string | null;
  description: string | null;
  payments: DebtPayment[];
}

interface DebtPayment {
  id: string;
  paymentDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  status: string;
}

interface DebtCardProps {
  debt: Debt;
  onViewDetails?: () => void;
  hasActiveFinancing?: boolean;
}

export default function DebtCard({ debt, onViewDetails, hasActiveFinancing = true }: DebtCardProps) {
  const [showSchedule, setShowSchedule] = useState(false);

  const getDebtTypeLabel = (type: string) => {
    const labels = {
      LOAN: 'Prêt',
      MORTGAGE: 'Hypothèque',
      CREDIT_LINE: 'Ligne de crédit',
      BOND: 'Obligation',
      OTHER: 'Autre'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getAmortizationTypeLabel = (type: string) => {
    const labels = {
      PROGRESSIVE: 'Progressif',
      LINEAR: 'Linéaire',
      IN_FINE: 'In fine',
      BULLET: 'Bullet'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'success';
      case 'PENDING': return 'warning';
      case 'OVERDUE': return 'error';
      default: return 'default';
    }
  };

  const calculateLTV = () => {
    return ((debt.remainingAmount / debt.amount) * 100).toFixed(1);
  };

  const calculateMonthlyPayment = () => {
    if (debt.payments.length === 0) return 0;
    
    const totalPaid = debt.payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.totalAmount, 0);
    
    const paidPayments = debt.payments.filter(p => p.status === 'PAID').length;
    
    return paidPayments > 0 ? (totalPaid / paidPayments) : debt.payments[0].totalAmount;
  };

  const getNextPayment = () => {
    return debt.payments.find(p => p.status === 'PENDING');
  };

  const nextPayment = getNextPayment();
  const monthlyPayment = calculateMonthlyPayment();

  // Déterminer si le financement est actif (il reste des paiements à faire)
  const isActiveFinancing = debt.remainingAmount > 0 && debt.payments.some(p => p.status === 'PENDING');

  return (
    <Card className={`p-6 ${isActiveFinancing 
      ? 'border-green-200 bg-green-50/30 shadow-green-100' 
      : 'border-gray-200 bg-gray-50/30 shadow-gray-100'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={getStatusColor(debt.type)}>
              {getDebtTypeLabel(debt.type)}
            </Badge>
            <Badge variant="outline">
              {getAmortizationTypeLabel(debt.amortizationType)}
            </Badge>
          </div>
          {debt.lender && (
            <p className="text-sm text-gray-600 mb-1">Prêteur: {debt.lender}</p>
          )}
          {debt.description && (
            <p className="text-sm text-gray-600">{debt.description}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-red-600">
            {debt.remainingAmount.toLocaleString()} €
          </p>
          <p className="text-sm text-gray-500">
            sur {debt.amount.toLocaleString()} €
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Taux d'intérêt</p>
          <p className="font-semibold">{debt.interestRate}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Durée</p>
          <p className="font-semibold">{debt.duration} ans</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">LTV</p>
          <p className="font-semibold">{calculateLTV()}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Mensualité</p>
          <p className="font-semibold">{monthlyPayment.toLocaleString()} €</p>
        </div>
      </div>

      {nextPayment && (
        <div className="bg-yellow-50 p-3 rounded-lg mb-4">
          <p className="text-sm font-medium text-yellow-800">Prochaine échéance</p>
          <div className="flex justify-between items-center">
            <p className="text-yellow-700">
              {new Date(nextPayment.paymentDate).toLocaleDateString('fr-FR')}
            </p>
            <p className="font-semibold text-yellow-800">
              {nextPayment.totalAmount.toLocaleString()} €
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSchedule(!showSchedule)}
        >
          {showSchedule ? 'Masquer' : 'Voir'} l'échéancier
        </Button>
        
        <div className="flex gap-2">
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              Voir détails
            </Button>
          )}
          <Button variant="outline" size="sm">
            Modifier
          </Button>
          <Button variant="outline" size="sm">
            Rembourser
          </Button>
        </div>
      </div>

      {showSchedule && (
        <div className="mt-4 border-t pt-4">
          <h4 className="font-medium mb-3">Échéancier de remboursement</h4>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-right py-2">Capital</th>
                  <th className="text-right py-2">Intérêts</th>
                  <th className="text-right py-2">Total</th>
                  <th className="text-center py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {debt.payments.map((payment) => (
                  <tr key={payment.id} className="border-b">
                    <td className="py-2">
                      {new Date(payment.paymentDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="text-right py-2">
                      {payment.principalAmount.toLocaleString()} €
                    </td>
                    <td className="text-right py-2">
                      {payment.interestAmount.toLocaleString()} €
                    </td>
                    <td className="text-right py-2 font-semibold">
                      {payment.totalAmount.toLocaleString()} €
                    </td>
                    <td className="text-center py-2">
                      <Badge variant={getStatusColor(payment.status)} size="sm">
                        {payment.status === 'PAID' ? 'Payé' : 
                         payment.status === 'PENDING' ? 'En attente' : 
                         payment.status === 'OVERDUE' ? 'En retard' : payment.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
} 