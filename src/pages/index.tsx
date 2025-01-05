'use client';

import React, { useState, useEffect } from 'react';
import { getAllGameDetails, createGame, deleteGame } from '../utils/contractUtils';
import { getAccount } from '@wagmi/core';
import { config } from '../wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { FaTrash } from 'react-icons/fa'; // Import delete icon
import { set } from 'react-datepicker/dist/date_utils';

const Page = () => {
  const [gameDetails, setGameDetails] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGameData, setNewGameData] = useState({
    name: '',
    vision: '',
    imageUrl: '',
    githubUrl: '',
  });

  const fetchGameDetails = async () => {
    setLoading(true);
    try {
      const games = await getAllGameDetails();
      console.log('Games:', games);
      const validGames = games[0].filter((game) => game.exists === true);
      setGameDetails(validGames);
    } catch (err) {
      console.error('Error fetching game details:', err);
      alert('Failed to fetch game details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const account = getAccount(config);

  useEffect(() => {
    if (account.address) {
      const userProjects = gameDetails.filter(
        (game) => String(game.owner) === String(account.address)
      );
      setMyProjects(userProjects);
    }
  }, [account.address, gameDetails]);

  useEffect(() => {
    fetchGameDetails();
  }, []);

  const handleDelete = async (gameId) => {
    if(account.isConnected === false){
      alert('Please connect your wallet to create a game.');
      return;
    }
    const confirm = window.confirm('Are you sure you want to delete this game?');
    if (confirm) {
      try {
        await deleteGame(gameId);
        alert('Game deleted successfully.');
        fetchGameDetails(); // Refresh project list after deletion
      } catch (err) {
        console.error('Error deleting game:', err);
        alert('Failed to delete game. Please try again later.');
      }
    }
  };

  const renderCard = (game, index, showDeleteIcon = false) => (
    <div
      key={index}
      style={{
        maxWidth: '300px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#2D3748',
        color: 'white',
        margin: '10px',
        position: 'relative',
      }}
    >
      {showDeleteIcon && (
        <FaTrash
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            cursor: 'pointer',
            color: '#E53E3E',
          }}
          onClick={() => handleDelete(game.id)}
        />
      )}
      <img
        src={game.imageUrl && (game.imageUrl.startsWith('http://') || game.imageUrl.startsWith('https://')) ? game.imageUrl : 'https://t4.ftcdn.net/jpg/05/64/31/67/240_F_564316725_zE8llusnCk3Sfr9rdfKya6fV7BQbjfyV.jpg'}
        alt="Game Placeholder"
        style={{
          width: '100%',
          height: '180px',
          objectFit: 'cover',
        }}
      />
      <div style={{ padding: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600' }}>{game.name}</h2>
        <p style={{ color: 'white', marginTop: '8px' }}>{game.vision}</p>
        <p style={{ color: 'white', marginTop: '8px' , wordBreak :"break-word"}}>
          <a
            href={game.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#63B3ED' }}
          >
            GitHub: {game.githubUrl}
          </a>
        </p>
        <p style={{ color: 'white', marginTop: '8px' , wordWrap: 'break-word', whiteSpace: 'normal' }}>Owner: {game.owner}</p>
        <div style={{ marginTop: '16px' }}>
          <Link href={`/${game.id}/proposal`}>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#48BB78',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '8px',
              }}
            >
              Proposals
            </button>
          </Link>
          <Link href={`/${game.id}/campaign`}>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#F6AD55',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Campaigns
            </button>
          </Link>
        </div>
      </div>
    </div>
  );

  const handleCreateFormSubmit = async () => {

    if(account.isConnected === false){
      alert('Please connect your wallet to create a game.');
      return;
    }
    try{
      const { name, vision, imageUrl, githubUrl } = newGameData;
      if (!name || !vision || !githubUrl) {
        return alert('Please fill out all required fields.');
      }

      console.log('Creating game:', newGameData);
      const tx = await createGame(name, vision, githubUrl, imageUrl || 'n/a');
      fetchGameDetails();
      alert('Game Created! Transaction: ' + tx);
      setShowCreateForm(false);

    }
    catch(err){
      console.error('Error creating game:', err);
      setShowCreateForm(false);
      alert('Failed to create game. Please try again later.' , err.message);
    }
   
  };

  const handleChange = (e) => {
    setNewGameData({ ...newGameData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div style={{ padding: '32px 16px' }}>
        <p style={{ color: 'white' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 16px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: 'Orange' }}>
        All Active Projects
      </h1>

      {showCreateForm && (
        <div
          style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: '#4A5568',
            borderRadius: '8px',
            color: 'white',
            position:"absolute",
            zIndex: 1,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <h2>Create New Game</h2>
          <input
            type="text"
            name="name"
            placeholder="Game Name"
            value={newGameData.name}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px' }}
          />
          <textarea
            name="vision"
            placeholder="Game Vision"
            value={newGameData.vision}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', height: '100px' }}
          />
          <input
            type="text"
            name="imageUrl"
            placeholder="Image URL (Optional)"
            value={newGameData.imageUrl}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px' }}
          />
          <input
            type="text"
            name="githubUrl"
            placeholder="GitHub URL"
            value={newGameData.githubUrl}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px' }}
          />
          <button
            onClick={handleCreateFormSubmit}
            style={{
              padding: '8px 16px',
              backgroundColor: '#63B3ED',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Create Game
          </button>

          <button
            onClick={() => setShowCreateForm(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: 'red',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginLeft: '28px',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
        }}
      >
        {gameDetails.length > 0
          ? gameDetails.map((game, index) => renderCard(game, index))
          : <p style={{ color: 'white' }}>No active projects available.</p>}
      </div>

      <h1 style={{ fontSize: '24px', fontWeight: '700', marginTop: '48px', marginBottom: '24px', color: 'orange' }}>
        My Projects
      </h1>
      <button
        onClick={() => setShowCreateForm(true)}
        style={{
          marginLeft: 'auto',
          display: 'block',
          marginBottom: '20px',
          padding: '8px 16px',
          backgroundColor: 'blue',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
       Create New Game
      </button>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
        }}
      >
        {myProjects.length > 0
          ? myProjects.map((project, index) => renderCard(project, index, true))
          : <p style={{ color: 'white' }}>You have not created any projects yet.</p>}
      </div>
    </div>
  );
};

export default Page;
