import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Card } from './Card';

interface SeizurePredictionProps {
  riskLevel: 'low' | 'medium' | 'high';
  timeToSeizure?: number; // in minutes
  confidenceLevel: number; // percentage
}

export const SeizurePrediction: React.FC<SeizurePredictionProps> = ({
  riskLevel,
  timeToSeizure,
  confidenceLevel,
}) => {
  const getRiskColor = () => {
    switch (riskLevel) {
      case 'low':
        return '#83D49B';
      case 'medium':
        return '#FFB366';
      case 'high':
        return '#FF8383';
      default:
        return '#8A8A8A';
    }
  };

  const getRiskIcon = () => {
    switch (riskLevel) {
      case 'low':
        return 'check-circle';
      case 'medium':
        return 'alert-triangle';
      case 'high':
        return 'alert-octagon';
      default:
        return 'help-circle';
    }
  };

  return (
    <Card
      style={{
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: getRiskColor(),
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <Icon name={getRiskIcon()} size={48} color={getRiskColor()} />

        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: getRiskColor(),
            marginTop: 12,
            textTransform: 'uppercase',
          }}
        >
          {riskLevel} RISK
        </Text>

        {timeToSeizure && (
          <View
            style={{
              marginTop: 16,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: `${getRiskColor()}20`,
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: getRiskColor(),
              }}
            >
              Seizure possible in ~{timeToSeizure} minutes
            </Text>
          </View>
        )}

        <View
          style={{
            marginTop: 20,
            width: '100%',
            borderTopWidth: 1,
            borderTopColor: '#F0F0F0',
            paddingTop: 16,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, color: '#8A8A8A' }}>
              AI Confidence Level
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#3D3D3D',
              }}
            >
              {confidenceLevel}%
            </Text>
          </View>

          <View
            style={{
              marginTop: 8,
              height: 8,
              backgroundColor: '#F0F0F0',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${confidenceLevel}%`,
                height: '100%',
                backgroundColor: getRiskColor(),
                borderRadius: 4,
              }}
            />
          </View>
        </View>
      </View>
    </Card>
  );
};