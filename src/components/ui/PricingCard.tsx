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
            glowColor={glowColor || (isPopular ? '#6366f1' : undefined)}
            className={`flex flex-col items-center text-center py-12 ${isPopular ? 'scale-105 liquid-holographic' : ''}`}
        >
            {badge && (
                <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] text-white font-bold px-5 py-1.5 tracking-[0.3em] uppercase rounded-full z-20"
                    style={{
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                        boxShadow: '0 4px 15px rgba(220,38,38,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                    }}
                >
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
                        <span className="text-emerald-500">✓</span>
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
