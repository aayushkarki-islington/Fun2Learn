interface StatCardProps {
    value: number | string;
    label: string;
    color?: 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'red';
}

const colorClasses = {
    blue: 'border-blue-500 text-blue-600',
    green: 'border-green-500 text-green-600',
    yellow: 'border-yellow-500 text-yellow-600',
    purple: 'border-purple-500 text-purple-600',
    orange: 'border-orange-500 text-orange-600',
    red: 'border-red-500 text-red-600',
};

const StatCard = ({ value, label, color = 'blue' }: StatCardProps) => {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 ${colorClasses[color]} transition-transform hover:scale-105`}>
            <div className={`text-3xl font-bold ${colorClasses[color]}`}>
                {value}
            </div>
            <div className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                {label}
            </div>
        </div>
    );
};

export default StatCard;
