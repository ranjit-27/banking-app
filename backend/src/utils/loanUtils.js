export const calculateEMI = (principal, annualInterestRate, tenureMonths) => {

  const monthlyInterestRate = (annualInterestRate / 100) / 12;
 
  if (monthlyInterestRate === 0) {
    return principal / tenureMonths;
  }

  const emi = principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, tenureMonths) / (Math.pow(1 + monthlyInterestRate, tenureMonths) - 1);
  return parseFloat(emi.toFixed(2));
};
 

export const generateRepaymentSchedule = (loan) => {

  const emi = calculateEMI(loan.amount, loan.interestRate, loan.tenureMonths);
  const repayments = [];
  let remainingPrincipal = loan.amount;
 

  for (let i = 1; i <= loan.tenureMonths; i++) {
    // Calculate the interest component for the current month
    const interestComponent = remainingPrincipal * ((loan.interestRate / 100) / 12);

    const principalComponent = emi - interestComponent;
    remainingPrincipal -= principalComponent;

    repayments.push({
      loanId: loan._id,
      dueDate: new Date(new Date().setMonth(new Date().getMonth() + i)),
      amount: emi,
      paid: false,
    });
  }
 
  return repayments;
};