import { EliteCard } from '@/components/ui/EliteCard';
import { EliteButton } from '@/components/ui/EliteButton';

interface PricingCardProps {
    title: string;
    subtitle: string;
    price: string | number;
    period?: string;
    features: { text: string; highlighted?: boolean }[];
    buttonText: string;
    buttonHref: string;
    isPopular?: boolean;
    badge?: string;
    glowColor?: string;
}

export function PricingCard({
    title,
    subtitle,
    price,
    period = '/mes',
    features,
    buttonText,
    buttonHref,
    isPopular = false,
    badge,
    glowColor,
}: PricingCardProps) {
    return (
        <EliteCard
            title={title}
            subtitle={subtitle}
            glowColor={glowColor}
            className={`flex flex-col items-center text-center py-12 ${isPopular ? 'scale-105' : ''}`}
        >
            {badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-[8px] font-bold px-5 py-1.5 tracking-[0.3em] uppercase rounded-full shadow-[0_4px_15px_rgba(220,38,38,0.3)]">
                    {badge}
                </div>
            )}
            <div className="text-5xl font-black mb-8">
                ${price}
                <span className="text-xs text-zinc-500 font-normal">{period}</span>
            </div>
            <ul className={`space-y-4 text-xs mb-12 text-left w-full ${!isPopular ? 'text-zinc-400' : ''}`}>
                {features.map((feature, index) => (
                    <li key={index} className={`flex items-center gap-3 ${isPopular ? 'text-white' : ''}`}>
                        ✓{' '}
                        <span className={`uppercase tracking-widest ${feature.highlighted ? 'text-primary font-bold' : ''}`}>
                            {feature.text}
                        </span>
                    </li>
                ))}
            </ul>
            <EliteButton href={buttonHref} variant={isPopular ? 'primary' : 'outline'} fullWidth>
                {buttonText}
            </EliteButton>
        </EliteCard>
    );
}
