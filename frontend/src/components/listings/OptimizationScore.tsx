import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimizationScoreProps {
  score: number;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Bad';
  breakdown?: {
    baseScore: number;
    completenessBonus: number;
    priorityPublisherBonus: number;
    penalties: number;
    metrics: {
      totalDirectories: number;
      liveDirectories: number;
      pendingDirectories: number;
      errorDirectories: number;
    };
    completeness: {
      hasHours: boolean;
      hasCategory: boolean;
      hasWebsite: boolean;
      hasDescription: boolean;
      hasPhotos: boolean;
      hasLogo: boolean;
    };
    priorityPublishers: {
      googleLive: boolean;
      yelpLive: boolean;
      facebookLive: boolean;
    };
  };
}

export function OptimizationScore({ score, rating, breakdown }: OptimizationScoreProps) {
  const ratingConfig = {
    Excellent: {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: CheckCircle,
      message: 'Outstanding! Your business has excellent visibility.',
    },
    Good: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: TrendingUp,
      message: 'Great job! Your listings are performing well.',
    },
    Fair: {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: AlertCircle,
      message: 'Room for improvement. Boost your listings for better reach.',
    },
    Poor: {
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: AlertCircle,
      message: 'Your visibility is limited. Activate more directories to improve.',
    },
    Bad: {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: XCircle,
      message: 'Critical: Your business has minimal online visibility.',
    },
  };

  const config = ratingConfig[rating];
  const Icon = config.icon;

  return (
    <div className={cn('rounded-lg border p-6', config.bgColor, config.borderColor)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Icon className={cn('w-8 h-8', config.color)} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {rating} Optimization Rate – {score}%
              </h3>
              <p className={cn('text-sm mt-1', config.color)}>{config.message}</p>
            </div>
          </div>

          {/* Metrics */}
          {breakdown && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                label="Live Directories"
                value={breakdown.metrics.liveDirectories}
                total={breakdown.metrics.totalDirectories}
                color="green"
              />
              <MetricCard
                label="Pending"
                value={breakdown.metrics.pendingDirectories}
                total={breakdown.metrics.totalDirectories}
                color="blue"
              />
              <MetricCard
                label="Errors"
                value={breakdown.metrics.errorDirectories}
                total={breakdown.metrics.totalDirectories}
                color="red"
              />
              <MetricCard
                label="Total Score"
                value={score}
                suffix="%"
                color="gray"
              />
            </div>
          )}

          {/* Breakdown */}
          {breakdown && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Score Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {/* Profile Completeness */}
                <div className="space-y-2">
                  <div className="font-medium text-gray-700">Profile Completeness</div>
                  <div className="space-y-1 text-gray-600">
                    <ChecklistItem
                      label="Business hours"
                      checked={breakdown.completeness.hasHours}
                      points={5}
                    />
                    <ChecklistItem
                      label="Category/Industry"
                      checked={breakdown.completeness.hasCategory}
                      points={3}
                    />
                    <ChecklistItem
                      label="Website URL"
                      checked={breakdown.completeness.hasWebsite}
                      points={3}
                    />
                    <ChecklistItem
                      label="Description"
                      checked={breakdown.completeness.hasDescription}
                      points={3}
                    />
                    <ChecklistItem
                      label="Photos (3+)"
                      checked={breakdown.completeness.hasPhotos}
                      points={3}
                    />
                    <ChecklistItem
                      label="Logo"
                      checked={breakdown.completeness.hasLogo}
                      points={3}
                    />
                  </div>
                </div>

                {/* Priority Publishers */}
                <div className="space-y-2">
                  <div className="font-medium text-gray-700">Priority Publishers</div>
                  <div className="space-y-1 text-gray-600">
                    <ChecklistItem
                      label="Google Business"
                      checked={breakdown.priorityPublishers.googleLive}
                      points={5}
                    />
                    <ChecklistItem
                      label="Yelp"
                      checked={breakdown.priorityPublishers.yelpLive}
                      points={3}
                    />
                    <ChecklistItem
                      label="Facebook"
                      checked={breakdown.priorityPublishers.facebookLive}
                      points={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  total?: number;
  suffix?: string;
  color: 'green' | 'blue' | 'red' | 'gray';
}

function MetricCard({ label, value, total, suffix, color }: MetricCardProps) {
  const colorClasses = {
    green: 'text-green-600 bg-green-100',
    blue: 'text-blue-600 bg-blue-100',
    red: 'text-red-600 bg-red-100',
    gray: 'text-gray-600 bg-gray-100',
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={cn('text-2xl font-bold mt-2', colorClasses[color])}>
        {value}
        {total !== undefined && <span className="text-sm font-normal text-gray-500">/{total}</span>}
        {suffix}
      </div>
    </div>
  );
}

interface ChecklistItemProps {
  label: string;
  checked: boolean;
  points: number;
}

function ChecklistItem({ label, checked, points }: ChecklistItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {checked ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <XCircle className="w-4 h-4 text-gray-300" />
        )}
        <span className={checked ? 'text-gray-900' : 'text-gray-500'}>{label}</span>
      </div>
      <span className="text-xs text-gray-500">+{points} pts</span>
    </div>
  );
}
