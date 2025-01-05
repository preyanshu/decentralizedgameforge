import { useState, useEffect } from 'react';
import { useRouter } from 'next/router'; // To get dynamic gameId
import { getAllGameDetails, contribute , withdrawFunds } from '../../utils/contractUtils'; // Assuming this is the contract function you call to get data
import { getAccount } from '@wagmi/core';
import { config } from '../../wagmi';
import { ethers } from 'ethers';

const CampaignPage = () => {
  const router = useRouter();
  const { gameId } = router.query; // Get the dynamic gameId
  const [gameDetails, setGameDetails] = useState(null); // Storing full game data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // To handle errors
  const account = getAccount(config);



  // Get countdown until deadline
  const getCountdown = (deadline) => {

    console.log('deadline', deadline);
   const remainingTime = parseInt(deadline)- Date.now()/1000; // Calculate remaining time in s
   if (remainingTime<=0) return "Expired";
 
   const days = Math.floor(remainingTime/ 86400);  // 1 day = 86400 seconds
   const hours = Math.floor((remainingTime % 86400) / 3600);  // 1 hour = 3600 seconds
   return `${days} days, ${hours} hours`;
 };

  // Fetching game details, proposals, and campaigns from the smart contract
  const fetchGameDetails = async () => {
    setLoading(true);
    setError(null); // Reset error on each fetch
    try {
      const [games, proposals, campaigns] = await getAllGameDetails();


      console.log('proposals', [games, proposals, campaigns]);

      console.log('games', games);
      if (!games || games.length === 0) {
        setError('No games found with the provided ID.');
        return;
      }

      const selectedGame = games.find((game) => parseInt(game?.id) === parseInt(gameId)); // Find the game by gameId
      if (!selectedGame) {
        setError('Game with the specified ID does not exist.');
        return;
      }

      const gameProposals = proposals[parseInt(gameId)]; // Access proposals for the specific game
      const gameCampaigns = campaigns[parseInt(gameId)]; // Access campaigns for the specific game

      console.log('gameProposals', gameCampaigns);

      if (!gameProposals || !gameCampaigns) {
        setError('Proposals or campaigns are missing for this game.');
        return;
      }

      setGameDetails({
        game: selectedGame,
        proposals: gameProposals,
        campaigns: gameCampaigns,
      });

      console.log('gameDetails', {
        game: selectedGame,
        proposals: gameProposals,
        campaigns: gameCampaigns,
      });

    } catch (err) {
      console.error('Error fetching game details:', err);
      setError('An error occurred while fetching game details.');
    } finally {
      setLoading(false);
    }
  };
  

  const handleContribute = async (campaignId) => {
    if(account.isConnected === false){
      alert('Please connect your wallet');
      return;
    }
    try {
      // Prompt user to enter the amount of ETH they want to contribute
      let amount = window.prompt('Enter the amount of ETH you want to contribute:');
      
      if (!amount) return; // If user cancels the prompt
      
      // Convert amount to number
      amount = parseFloat(amount);
      
      // Ensure the amount is a valid number and at least 0.2 ETH
      if (isNaN(amount) || amount < 0.2) {
        alert('Please enter a valid amount (at least 0.2 ETH).');
        return;
      }
  
      // Convert the amount from ETH to Wei (1 ETH = 1e18 Wei)
      const amountInWei = BigInt(ethers.parseEther(amount.toString()));
  
      // Call the contribute function
      await contribute(campaignId, amountInWei);
      alert('Contribution successful.');
  
      // Refresh campaign list after contribution
      fetchGameDetails();
    } catch (err) {
      console.error('Error contributing to campaign:', err);
      alert('Failed to contribute to the campaign. Please try again later.');
    }
  };

  const handleWithDraw = async (campaignId) => {

    if(account.isConnected === false){
      alert('Please connect your wallet');
      return;
    }

    try {
      // Call the contribute function
      console.log('campaignId', campaignId);
      await withdrawFunds(campaignId);
      alert('WithDraw successful.');
  
      // Refresh campaign list after contribution
      fetchGameDetails();
    } catch (err) {
      console.error('Error withdraw to campaign:', err);
      alert('Failed to withdraw to the campaign. Please try again later.');
    }
  };

  useEffect(() => {
    if (gameId) {
      fetchGameDetails();
    }
  }, [gameId]);

  // Render active and completed campaigns
  const renderCampaignsSection = () => (
    <>
      <h2 style={{  fontSize: '24px' }}>Active Campaigns</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '20px',
        padding: '10px',
        backgroundColor: '#333333',
        borderRadius: '8px'
      }}>
        {gameDetails.campaigns.filter((campaign) =>  Number(campaign.deadline) > Date.now()/1000 &&  !campaign.success).length > 0 ? (
          gameDetails.campaigns
            .filter((campaign) =>  (Number(campaign.deadline) > Date.now()/1000) && !campaign.success)
            .map((campaign, index) => (
              <div key={index} style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                backgroundColor: '#2D3748',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
              }}>
                <h3 style={{ color: '#0073e6', fontSize: '20px' }}>Description: {campaign.description}</h3>
                <p><strong>Goal:</strong> {ethers.formatEther(campaign.goal)} ETH</p>
                <p><strong>Funds Raised:</strong> {ethers.formatEther(campaign.fundsRaised)} ETH</p>
                <p><strong>Ends in:</strong> {getCountdown(campaign.deadline)}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#0073e6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}

                    onClick={() => handleContribute(campaign.id)}
                  >
                    Contribute
                  </button>
                 </div>
              </div>
            ))
        ) : (
          <p>No active campaigns available.</p>
        )}
      </div>

      <h2 style={{ fontSize: '24px' }}>Completed Campaigns</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '20px',
        padding: '10px',
        backgroundColor: '#333333',
        borderRadius: '8px'
      }}>
        {gameDetails.campaigns.filter((campaign) => campaign.success || (Number(campaign.deadline) < Date.now()/1000) ).length > 0 ? (
          gameDetails.campaigns
            .filter((campaign) => campaign.success || (Number(campaign.deadline) < Date.now()/1000) )
            .map((campaign, index) => (
              <div key={index} style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                backgroundColor: '#2D3748',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
              }}>
                <h3 style={{ color: '#0073e6', fontSize: '20px' }}>Description: {campaign.description}</h3>
                <p><strong>Goal:</strong> {ethers.formatEther(campaign.goal)} ETH</p>
<p><strong>Funds Raised:</strong> {ethers.formatEther(campaign.fundsRaised)} ETH</p>
                <p><strong>Ends in:</strong> 0 Days , 0 Hours</p>
                <p><strong>Status:</strong> {campaign.success ? 'Success' : 'Failed'}</p>
                <p><strong>Funds Withdrawn:</strong> {campaign.fundsWithdrawn ? 'Yes' : 'No'}</p>

                {account?.address && account.address === gameDetails?.game?.owner  && !campaign.fundsWithdrawn  &&<>
                  <button
            style={{
              marginBottom: '20px',
              padding: '10px 15px',
              backgroundColor: 'green',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
            onClick={() => {

                handleWithDraw(campaign.id);
              
              
              
            }}
            
          >
            WithDraw Funds
          </button>
                </>}
              </div>

              
            ))
        ) : (
          <p>No completed campaigns available.</p>
        )}
      </div>
    </>
  );

  if (loading) {
    return <p style={{ fontSize: '18px', color: '#0073e6' }}>Loading...</p>;
  }

  if (error) {
    return (
      <div style={{
        color: '#d9534f',
        padding: '20px',
        borderRadius: '5px',
        backgroundColor: '#f2dede',
        margin: '20px 0'
      }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }  

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        padding: '20px',
        backgroundColor: '#333333',
        color: '#fff',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '28px' }}>Game Details for Game: {gameDetails.game.name}</h1>
        {gameDetails.game.imageUrl && (
          <img 
          src={gameDetails.game.imageUrl && (gameDetails.game.imageUrl.startsWith('http://') || gameDetails.game.imageUrl.startsWith('https://')) ? gameDetails.game.imageUrl : 'https://t4.ftcdn.net/jpg/05/64/31/67/240_F_564316725_zE8llusnCk3Sfr9rdfKya6fV7BQbjfyV.jpg'} 
            alt="Game Image" 
            style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '20px' }} 
          />
        )}
        <p><strong>ID:</strong> {parseInt(gameDetails.game.id)}</p>
        <p><strong>Vision:</strong> {gameDetails.game.vision}</p>
        <p><strong>Creator:</strong> {gameDetails.game.owner}</p>
        <p><strong>Status:</strong> {gameDetails.game.exists ? "Active" : "Inactive"}</p>
      </div>

      {gameDetails && renderCampaignsSection()}
    </div>
  );
};

export default CampaignPage;
