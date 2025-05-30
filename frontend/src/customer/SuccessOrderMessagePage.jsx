import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { CheckCircleOutline, ShoppingBag, ArrowBack } from '@mui/icons-material';

// Styled Components
const PageContainer = styled.div`
  background-color: rgb(255, 255, 255);
  height: 100vh;
  height: 100dvh;
  width: 100vw;
  max-width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overscroll-behavior-y: none;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: #ff8c00;
  color: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  &:active {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const Content = styled.main`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const SuccessCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin: 0 auto;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 300px;
  margin: 24px auto 0;
`;

const PrimaryButton = styled.button`
  background: #ff8c00;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  transition: background-color 0.2s;
  &:active {
    background-color: #e67e00;
  }
`;

const SecondaryButton = styled(PrimaryButton)`
  background: #f0f0f0;
  color: #333;
  &:active {
    background-color: #e0e0e0;
  }
`;

const SuccessOrderMessagePage = () => {
    const navigate = useNavigate();

    const handleViewOrders = () => {
        navigate('/customer/view-my-order');
    };

    const handleContinueShopping = () => {
        navigate('/customer/home');
    };

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <PageContainer>
            <Header>
                <BackButton onClick={handleBack}>
                    <ArrowBack />
                    <span>Back</span>
                </BackButton>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Order Confirmation</h2>
                <div style={{ width: '48px' }}></div> {/* For alignment */}
            </Header>

            <Content>
                <SuccessCard>
                    <CheckCircleOutline 
                        style={{
                            fontSize: 80,
                            color: '#4caf50',
                            marginBottom: '24px'
                        }}
                    />
                    
                    <h2 style={{
                        color: '#4caf50',
                        margin: '0 0 16px 0',
                        fontSize: '24px',
                        fontWeight: 700
                    }}>
                        Order Successfully Submitted!
                    </h2>
                    
                    <p style={{
                        color: '#666',
                        margin: '0 0 32px 0',
                        fontSize: '16px',
                        lineHeight: '1.5'
                    }}>
                        Please wait for the seller to confirm your order. You can check the status in your orders.
                    </p>

                    <ButtonContainer>
                        <PrimaryButton onClick={handleViewOrders}>
                            <ShoppingBag style={{ fontSize: '20px' }} />
                            View My Orders
                        </PrimaryButton>
                        <SecondaryButton onClick={handleContinueShopping}>
                            Continue Shopping
                        </SecondaryButton>
                    </ButtonContainer>
                </SuccessCard>
            </Content>
        </PageContainer>
    );
};

export default SuccessOrderMessagePage;