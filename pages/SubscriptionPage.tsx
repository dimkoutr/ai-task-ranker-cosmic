
import React, { useState, useEffect } from 'react';
import { User, SubscriptionTier, TierDetails } from '../types';
import { SUBSCRIPTION_PLANS, getTierDetails } from '../constants';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon'; // For features not included (optional)
import { ArrowRightIcon } from '../components/icons/ArrowRightIcon';

interface SubscriptionPageProps {
  currentUser: User;
  onSelectPlan: (newTier: SubscriptionTier) => void;
  onBack: () => void;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({
  currentUser,
  onSelectPlan,
  onBack,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionTier>(currentUser.subscriptionTier);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlanSelect = async (planId: SubscriptionTier) => {
    if (planId === currentUser.subscriptionTier) {
        // If current plan is re-selected, perhaps just navigate back or give feedback
        onBack(); 
        return;
    }
    setIsLoading(true);
    setSelectedPlanId(planId);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 700)); 
    onSelectPlan(planId);
    // App.tsx will handle feedback and navigation after successful update
    setIsLoading(false);
  };
  
  const PlanCard: React.FC<{ plan: TierDetails; isCurrent: boolean; onSelect: () => void; isLoadingThis: boolean }> = ({ plan, isCurrent, onSelect, isLoadingThis }) => {
    const cardBase = "bg-surface-primary backdrop-blur-md rounded-2xl p-6 md:p-8 border transition-all duration-300 ease-in-out transform hover:scale-[1.02]";
    let dynamicCardClasses = "border-border-secondary hover:border-purple-500/70 hover:shadow-secondary";

    if (isCurrent) {
      dynamicCardClasses = "plan-card-current"; // Uses CSS variable for glow and border
    }
    if (plan.highlight) {
      // Highlighted populaire plan gets a more prominent animated glow
      dynamicCardClasses += " plan-card-highlighted-popular";
    } else if (isCurrent && !plan.highlight) {
      // If it's current but not the "popular" one, still give it a clear distinction
      dynamicCardClasses = "plan-card-current"; // Ensures current plan has its distinct style
    }


    return (
      <div className={`${cardBase} ${dynamicCardClasses} relative overflow-hidden flex flex-col animate-fadeInUp`}>
        {plan.highlight && (
          <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg shadow-md z-10">
            {plan.highlight}
          </div>
        )}
        <div className="flex-grow">
          <h3 className={`text-2xl font-bold mb-2 text-center ${isCurrent ? 'text-gradient-purple-pink-sky' : 'text-text-accent'}`}>{plan.name}</h3>
          <p className="text-3xl md:text-4xl font-extrabold text-text-primary text-center mb-1">
            {plan.isFree ? 'Free' : plan.priceMonthly}
            {!plan.isFree && <span className="text-base font-normal text-text-muted"> /month</span>}
          </p>
          {plan.priceYearly && !plan.isFree && (
             <p className="text-xs text-green-400 text-center mb-4">{plan.priceYearly}</p>
          )}
          {plan.isFree && <p className="text-xs text-text-muted text-center mb-4 opacity-0">-</p> /* Spacer */}


          <ul className="space-y-2.5 my-6 text-sm">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2.5 text-text-secondary">
                <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-px" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={onSelect}
          disabled={isLoading || isLoadingThis}
          title={isCurrent ? `This is your current plan: ${plan.name}` : `Select ${plan.name} plan`}
          className={`w-full mt-auto py-3 px-6 rounded-lg font-semibold transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 button-active-pop button-hover-glow flex items-center justify-center gap-2 group
            ${isCurrent ? 'button-secondary bg-green-600/20 hover:bg-green-600/30 border-green-500 text-green-300 focus-visible:ring-green-400' : 
                         (plan.isFree ? 'button-secondary focus-visible:ring-slate-400' : 'button-primary text-white focus-visible:ring-pink-400')}
            ${isLoadingThis ? 'opacity-70 cursor-wait' : ''}
          `}
        >
          {isLoadingThis ? (
            <>
              <SparklesIcon className="w-5 h-5 animate-spin" /> Processing...
            </>
          ) : isCurrent ? (
            <>
              <CheckCircleIcon className="w-5 h-5" /> Current Plan
            </>
          ) : (
            <>
              {plan.ctaText} <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
        {plan.id !== 'free' && (
            <p className="text-xs text-text-muted text-center mt-3">No real payment required for this demo.</p>
        )}
      </div>
    );
  };


  return (
    <div className="page-container-flex">
      <header className="page-header-area p-4 md:p-8 md:pb-6">
        <div className="container mx-auto max-w-5xl">
          <button
            onClick={onBack}
            className="text-text-accent hover:text-text-accent-hover transition-colors duration-200 text-sm hover:underline mb-4 inline-flex items-center gap-1 group focus:outline-none focus-visible:ring-1 focus-visible:ring-border-focus-alt rounded"
            title="Go back to previous page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-sky-rose-lime flex items-center justify-center gap-x-3 text-center">
            <SparklesIcon className="w-9 h-9 md:w-11 md:h-11 text-yellow-300 opacity-80 animate-sparkles-pulse" />
            Choose Your Cosmic Plan
            <SparklesIcon className="w-9 h-9 md:w-11 md:h-11 text-pink-400 opacity-80 animate-sparkles-pulse [animation-delay:-1s]" />
          </h1>
          <p className="text-text-secondary mt-3 text-lg text-center">
            Unlock the full potential of AI Task Ranker. Select a plan that suits your journey.
          </p>
        </div>
      </header>

      <main className="page-content-scrollable p-4 md:p-8 md:pt-0">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {SUBSCRIPTION_PLANS.map((plan, index) => (
              <div key={plan.id} style={{ animationDelay: `${index * 100}ms` }}>
                <PlanCard 
                  plan={plan} 
                  isCurrent={plan.id === currentUser.subscriptionTier}
                  onSelect={() => handlePlanSelect(plan.id)}
                  isLoadingThis={isLoading && selectedPlanId === plan.id}
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="page-footer-area text-center py-6 text-text-muted text-sm">
        <p>Subscription plans are for demonstration purposes only.</p>
      </footer>
    </div>
  );
};

export default SubscriptionPage;
