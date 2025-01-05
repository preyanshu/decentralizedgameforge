import { useState, useEffect } from 'react';
import { useRouter } from 'next/router'; 
import { getAllGameDetails , createProposal , voteProposal , createCrowdfunding } from '../../utils/contractUtils'; // Assuming this is the contract function you call to get data
import { getAccount } from '@wagmi/core';
import { config } from '../../wagmi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import {ethers} from 'ethers';


const ProposalPage = () => {
  const router = useRouter();
  const { gameId } = router.query; // Get the dynamic gameId
  const [gameDetails, setGameDetails] = useState(null); // Storing full game data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // To handle errors


  const [showProposalModal, setShowProposalModal] = useState(false);

  const [proposalData, setProposalData] = useState({
    description: '',
    deadline: new Date(),
  });
  
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  const [campaignData, setCampaignData] = useState({
    gameId: '',
    proposalId: '',
    description: '',
    targetAmount: 0,
    deadline: new Date(),
  });
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

  const handleCreateProposal = async () => {

    if(account.isConnected === false){
      alert('Please connect your wallet to create a game.');
      return;
    }
    
    if (!proposalData.description || !proposalData.deadline) {
      alert('Please fill out all fields.');
      return;
    }
    

    console.log('proposalData', proposalData);
    const deadlineUnix = Math.floor(new Date(proposalData.deadline).getTime()/1000);

    



    if (deadlineUnix - Math.floor(Date.now())/1000 < 15 * 24 * 60 * 60) {
      alert('Deadline must be at least 15 days from today.');
      return;
    }


    console.log('deadlineUnix', deadlineUnix);
    try {

      console.log({
        gameId: parseInt(gameId),
        description: proposalData.description,
        deadline: BigInt(deadlineUnix),
      });
 
      await createProposal(parseInt(gameId), proposalData.description, BigInt(deadlineUnix));

      alert('Proposal created successfully!');
      fetchGameDetails(); // Refresh proposals
      setShowProposalModal(false); // Close modal
    } catch (err) {
      console.error('Error creating proposal:', err);
      alert('An error occurred while creating the proposal.');
    }
  };


  const handleCreateCampaign = async () => {

    if(account.isConnected === false){
      alert('Please connect your wallet to create a game.');
      return;
    }

    if ( !campaignData.targetAmount || !campaignData.deadline) {
      alert('Please fill out all fields.');
      return;
    }

    if(campaignData.targetAmount <= 0){
      alert('Target Amount must be greater than 0.');
      return;
    }

    if(campaignData.gameId === '' || campaignData.proposalId === ''){
      alert('GameId and ProposalId not found.');
      return;
    }

    const deadlineUnix = Math.floor(new Date(campaignData.deadline).getTime()/1000);

    if (deadlineUnix - Math.floor(Date.now())/1000 < 15 * 24 * 60 * 60) {
      alert('Deadline must be at least 15 days from today.');
      return;
    }

    const targetAmount = ethers.parseEther(campaignData.targetAmount.toString());

    try {
      await createCrowdfunding(
        parseInt(campaignData.gameId), 
        parseInt(campaignData.proposalId),
        BigInt(targetAmount), 
        BigInt(deadlineUnix)
      );
      alert('Campaign created successfully!');
      fetchGameDetails(); 
      setShowCampaignModal(false);
    } catch (err) {
      console.error('Error creating campaign:', err);
      alert('An error occurred while creating the campaign.');
    }
  };



  const handleVote = async (proposalId, voteType) => {

    if(account.isConnected === false){
      alert('Please connect your wallet to create a game.');
      return;
    }
    if (!account.address) {
      alert('Please connect your wallet to vote.');
      return;
    }
   

    console.log('voteType', proposalId, voteType);
    // Ensure user confirms they only vote once
    const confirmed = window.confirm('You can only vote once. Are you sure? if already voted transaction will fail');
    if (!confirmed) return;

    

    try {
      await voteProposal(proposalId, voteType); // Call the contract function with the voteType ('yes' or 'no')
      alert('Vote cast successfully!');
      fetchGameDetails(); // Refresh game details to show updated votes
    } catch (err) {
      console.error('Error voting on proposal:', err);
      alert('An error occurred while casting your vote.');
    }
  };

  useEffect(() => {
    if (gameId) {
      fetchGameDetails();
    }
  }, [gameId]);

  // Render active and completed proposals
  const renderProposalsSection = () => (
    <>
    <div style={{display:"flex",justifyContent:"space-between"}}>
      <h2 style={{ color: 'orange', fontSize: '24px' }}>Active Proposals</h2>

      <button
            style={{
              marginBottom: '20px',
              padding: '10px 15px',
              backgroundColor: '#0073e6',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
            onClick={() => setShowProposalModal(true)}
           
          >
            Create Proposal
          </button>

          </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '20px',
        padding: '10px',
        backgroundColor: '#333333',
        borderRadius: '8px'
      }}>
        {gameDetails.proposals.filter((proposal) => !proposal.executed && Number(proposal.deadline) > Date.now()/1000).length > 0 ? (
          gameDetails.proposals
            .filter((proposal) => !proposal.executed && Number(proposal.deadline) > Date.now()/1000)
            .map((proposal, index) => (
              <div key={index} style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                backgroundColor:"#2D3748",
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
              }}>
                <h3 style={{ color: '#0073e6', fontSize: '20px' , wordWrap: 'break-word', whiteSpace: 'normal', }}>Proposal by {proposal.creator}</h3>
                <p>{proposal.description}</p>
                <p><strong>Ends in:</strong> {getCountdown(proposal.deadline)}</p>
                <p><strong>No Votes:</strong> {Number(proposal.noVotes)}</p>
                <p><strong>Yes Votes:</strong> {Number(proposal.yesVotes)}</p>


                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleVote(proposal.id, true)}>
                    <FaThumbsUp size={24} color="#28a745" style={{marginRight:"10px"}}/>
                    <span>{Number(proposal.yesVotes)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer',marginTop:"5px"  }} onClick={() => handleVote(proposal.id, false)}>
                    <FaThumbsDown size={24} color="#dc3545" style={{marginRight:"10px"}} />
                    <span>{Number(proposal.noVotes)}</span>
                  </div>
                </div>
              </div>

              
            ))
        ) : (
          <p>No active proposals available.</p>
        )}
      </div>

      <h2 style={{ color: 'orange', fontSize: '24px' }}>Completed Proposals</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '20px',
        padding: '10px',
        backgroundColor: '#333333',
        borderRadius: '8px'
      }}>
          {gameDetails?.proposals?.filter((proposal) => proposal.deadline < Date.now()/1000).length > 0 ? (
          gameDetails.proposals
            .filter((proposal) => proposal.deadline < Date.now()/1000)
            .map((proposal, index) => (
              <div key={index} style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                backgroundColor:"#2D3748",
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
              }}>
                <h3 style={{ color: '#0073e6', fontSize: '20px',wordWrap: 'break-word', whiteSpace: 'normal',  }}>Proposal by {proposal.creator}</h3>
                <p>{proposal.description}</p>
                <p><strong>Deadline:</strong> {getCountdown(proposal.deadline)}</p>
                <p><strong>Executed:</strong>{proposal.executed?"True":"False"}</p>
                <p><strong>No Votes:</strong> {Number(proposal.noVotes)}</p>
                <p><strong>Yes Votes:</strong> {Number(proposal.yesVotes)}</p>
               
                <p style={{ color: Number(proposal.noVotes) === Number(proposal.yesVotes) ? "grey" : Number(proposal.noVotes) > Number(proposal.yesVotes) ? "red" : "green" }}>
  {Number(proposal.noVotes) === Number(proposal.yesVotes) ? "Drawn" : Number(proposal.noVotes) > Number(proposal.yesVotes) ? "Proposal Rejected by Community" : "Proposal Approved by Community"}
</p>


                {account?.address && String(account.address) === String(gameDetails?.game?.owner) && (Number(proposal.noVotes)<Number(proposal.yesVotes) ) &&<>
                  <button
            style={{
              marginBottom: '20px',
              padding: '10px 15px',
              backgroundColor: 'red',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
            onClick={() => {
              
              setCampaignData({ ...campaignData, gameId: gameId, proposalId: proposal.id });
              setShowCampaignModal(true);
              
            }}
            disabled={ proposal.executed}  
          >
            {proposal.executed ? 'Campaign already Created' : 'Create Campaign'}
          </button>
                </>}
              </div>
            ))
        ) : (
          <p>No completed proposals available.</p>
        )}
      </div>

  
    </>
  );



  const renderModal = () => (
    <>
      {showProposalModal && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',

            color:"black",
            zIndex: 1000,
            width: '400px',
          }}
        >
          <h2 style={{ marginBottom: '20px' }}>Create a Proposal</h2>
  
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Proposal Title</label>
            <input
              type="text"
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
              value={proposalData.title}
              onChange={(e) => setProposalData({ ...proposalData, title: e.target.value })}
              placeholder="Enter proposal title"
            />
          </div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Description</label>
          <textarea
            style={{
              width: '100%',
              height: '100px',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
            value={proposalData.description}
            onChange={(e) => setProposalData({ ...proposalData, description: e.target.value })}
          />

          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Deadline</label>
          <DatePicker
            selected={proposalData.deadline}
            onChange={(date) => setProposalData({ ...proposalData, deadline: date })}
            showTimeSelect
            dateFormat="Pp"
            style={{
              width: '100%',
              marginBottom: '10px',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '20px',
              }}
              onClick={handleCreateProposal}
            >
              Submit Proposal
            </button>
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '20px',
              }}
              onClick={() => setShowProposalModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
  
      {showCampaignModal && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            color:"black",
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            width: '400px',
          }}
        >
          <h2 style={{ marginBottom: '20px' }}>Create a Crowdfunding Campaign</h2>
  
  
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Goal (in Eth)</label>
          <input
            type="number"
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
            value={campaignData.targetAmount}
            onChange={(e) => setCampaignData({ ...campaignData, targetAmount: e.target.value })}
            placeholder="Target Amount"
          />

        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Deadline</label>
          <DatePicker
            selected={campaignData.deadline}
            onChange={(date) => setCampaignData({ ...campaignData, deadline: date })}
            showTimeSelect
            dateFormat="Pp"
            style={{
              width: '100%',
              marginBottom: '10px',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '20px',
            
              }}
              onClick={handleCreateCampaign}
            >
              Submit Campaign
            </button>
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',

                marginTop: '20px',
               
              }}
              onClick={() => setShowCampaignModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
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
        textAlign: 'center'
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

      {gameDetails && renderProposalsSection()}

      {renderModal()}



      
    </div>

      
    
  );
};

export default ProposalPage;
