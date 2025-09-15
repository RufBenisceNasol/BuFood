import React from 'react';
import styled, { css } from 'styled-components';

const baseButton = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  padding: 14px 20px;
  font-weight: 700;
  font-size: 14px;
  line-height: 1;
  min-height: 44px;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.06s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: translateY(1px);
  }
`;

export const PrimaryButton = styled.button`
  ${baseButton};
  background-color: #FF7A00;
  color: #fff;
  border: none;
  &:hover { background-color: #e86f00; }
  &:disabled { opacity: 0.7; cursor: not-allowed; }
`;

export const SecondaryButton = styled.button`
  ${baseButton};
  background-color: #fff;
  color: ${props => (props.$accent ? '#FF7A00' : '#333')};
  border: 1px solid ${props => (props.$accent ? '#FF7A00' : '#DDDDDD')};
  &:hover { background-color: #fafafa; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

export const DestructiveButton = styled.button`
  ${baseButton};
  background-color: #FF3B30;
  color: #fff;
  border: none;
  &:hover { background-color: #e2342a; }
  &:disabled { opacity: 0.7; cursor: not-allowed; }
`;

export const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: stretch;
`;

export default {
  PrimaryButton,
  SecondaryButton,
  DestructiveButton,
  ButtonRow,
};
