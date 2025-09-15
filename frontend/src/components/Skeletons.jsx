import React from 'react';

export const SkeletonCard = ({ height = 260, borderRadius = 12, style = {} }) => (
  <div
    aria-hidden
    style={{
      background: '#f6f6f6',
      borderRadius,
      height,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      ...style,
    }}
  />
);

export const SkeletonRow = ({ height = 88, borderRadius = 12, style = {} }) => (
  <div
    aria-hidden
    style={{
      background: '#f6f6f6',
      borderRadius,
      height,
      marginBottom: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      ...style,
    }}
  />
);

export const SkeletonCircle = ({ size = 120, style = {} }) => (
  <div
    aria-hidden
    style={{
      background: '#f0f0f0',
      width: size,
      height: size,
      borderRadius: '50%',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      ...style,
    }}
  />
);

export const SkeletonLine = ({ width = '60%', height = 14, borderRadius = 8, style = {} }) => (
  <div
    aria-hidden
    style={{
      background: '#f0f0f0',
      width,
      height,
      borderRadius,
      margin: '6px 0',
      ...style,
    }}
  />
);

export default {
  SkeletonCard,
  SkeletonRow,
  SkeletonCircle,
  SkeletonLine,
};
