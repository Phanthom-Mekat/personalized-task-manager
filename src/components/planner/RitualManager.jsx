import React, { useState } from 'react';
import { usePlanner } from '../../provider/PlannerProvider';
import RitualBanner from './RitualBanner';
import RitualChamber from './RitualChamber';

const RitualManager = () => {
    const { pendingRituals } = usePlanner();
    const [showChamber, setShowChamber] = useState(false);

    if (!pendingRituals || pendingRituals.length === 0) return null;

    return (
        <>
            <RitualBanner onOpen={() => setShowChamber(true)} />
            
            {showChamber && (
                <RitualChamber 
                    ritual={pendingRituals[0]} 
                    onClose={() => setShowChamber(false)} 
                />
            )}
        </>
    );
};

export default RitualManager;
