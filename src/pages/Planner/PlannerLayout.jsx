import { Outlet } from 'react-router-dom';
import PlannerSidebar from '../../components/planner/PlannerSidebar';
import PlannerProvider from '../../provider/PlannerProvider';
import RitualManager from '../../components/planner/RitualManager';

function PlannerLayout() {
    return (
        <PlannerProvider>
            <div className="flex h-screen bg-background overflow-hidden relative">
                <PlannerSidebar />
                <main className="flex-1 overflow-y-auto pb-20 md:pb-0 relative">
                    <RitualManager />
                    <div className="max-w-5xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </PlannerProvider>
    );
}

export default PlannerLayout;
