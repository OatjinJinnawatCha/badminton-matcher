import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Play, History, User, LogOut, RefreshCw } from 'lucide-react';

type SkillLevel = 'beginner' | 'intermediate' | 'pro-player';
type PlayingType = 'single' | 'double';

interface Player {
  id: string;
  name: string;
  skill: SkillLevel;
  gamesPlayed: number;
  isOnLeave: boolean;
}

interface Match {
  id: string;
  court: number;
  team1: Player[];
  team2: Player[];
  round: number;
}

interface MatchHistory {
  round: number;
  matches: Match[];
  timestamp: Date;
}

interface SavedState {
  players: Player[];
  history: MatchHistory[];
  roundNumber: number;
  courts: number;
  playingType: PlayingType;
  advancedMode: boolean;
}

export default function App() {
  // Load initial state from localStorage
  const loadState = (): SavedState => {
    try {
      const saved = localStorage.getItem('badmintonState');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          players: parsed.players || [],
          history: parsed.history?.map((h: any) => ({
            ...h,
            timestamp: new Date(h.timestamp)
          })) || [],
          roundNumber: parsed.roundNumber || 1,
          courts: parsed.courts || 1,
          playingType: parsed.playingType || 'double',
          advancedMode: parsed.advancedMode || false
        };
      }
    } catch (error) {
      console.error('Error loading state:', error);
    }
    return {
      players: [],
      history: [],
      roundNumber: 1,
      courts: 1,
      playingType: 'double',
      advancedMode: false
    };
  };

  const initialState = loadState();
  
  const [players, setPlayers] = useState<Player[]>(initialState.players);
  const [playerName, setPlayerName] = useState('');
  const [playerSkill, setPlayerSkill] = useState<SkillLevel>('beginner');
  const [courts, setCourts] = useState(initialState.courts);
  const [playingType, setPlayingType] = useState<PlayingType>(initialState.playingType);
  const [currentMatches, setCurrentMatches] = useState<Match[]>([]);
  const [history, setHistory] = useState<MatchHistory[]>(initialState.history);
  const [roundNumber, setRoundNumber] = useState(initialState.roundNumber);
  const [showHistory, setShowHistory] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(initialState.advancedMode);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('badmintonState', JSON.stringify({
        players,
        history,
        roundNumber,
        courts,
        playingType,
        advancedMode
      }));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }, [players, history, roundNumber, courts, playingType, advancedMode]);

  const addPlayer = () => {
    if (playerName.trim()) {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: playerName.trim(),
        skill: advancedMode ? playerSkill : 'intermediate',
        gamesPlayed: 0,
        isOnLeave: false
      };
      setPlayers([...players, newPlayer]);
      setPlayerName('');
    }
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const toggleLeave = (id: string) => {
    setPlayers(players.map(p => 
      p.id === id ? { ...p, isOnLeave: !p.isOnLeave } : p
    ));
  };

  const endDay = () => {
    if (window.confirm('Are you sure you want to end the day? This will clear all players, matches, and history.')) {
      setPlayers([]);
      setCurrentMatches([]);
      setHistory([]);
      setRoundNumber(1);
      setCourts(1);
      setPlayingType('double');
      setAdvancedMode(false);
      localStorage.removeItem('badmintonState');
    }
  };

  const generateMatches = () => {
    const activePlayers = players.filter(p => !p.isOnLeave);
    
    if (activePlayers.length < (playingType === 'single' ? 2 : 4)) {
      alert(`Need at least ${playingType === 'single' ? 2 : 4} active players!`);
      return;
    }

    // Sort players by games played (ascending) and skill level
    const sortedPlayers = [...activePlayers].sort((a, b) => {
      if (a.gamesPlayed !== b.gamesPlayed) {
        return a.gamesPlayed - b.gamesPlayed;
      }
      const skillOrder = { 'beginner': 0, 'intermediate': 1, 'pro-player': 2 };
      return skillOrder[a.skill] - skillOrder[b.skill];
    });

    const playersPerMatch = playingType === 'single' ? 2 : 4;
    const totalPlayersNeeded = courts * playersPerMatch;
    const availablePlayers = sortedPlayers.slice(0, totalPlayersNeeded);

    const matches: Match[] = [];
    
    for (let i = 0; i < courts; i++) {
      const matchPlayers = availablePlayers.slice(i * playersPerMatch, (i + 1) * playersPerMatch);
      
      if (matchPlayers.length === playersPerMatch) {
        const match: Match = {
          id: `${Date.now()}-${i}`,
          court: i + 1,
          team1: playingType === 'single' 
            ? [matchPlayers[0]] 
            : [matchPlayers[0], matchPlayers[1]],
          team2: playingType === 'single' 
            ? [matchPlayers[1]] 
            : [matchPlayers[2], matchPlayers[3]],
          round: roundNumber
        };
        matches.push(match);

        // Update games played count
        matchPlayers.forEach(player => {
          player.gamesPlayed++;
        });
      }
    }

    setCurrentMatches(matches);
    
    // Add to history
    const historyEntry: MatchHistory = {
      round: roundNumber,
      matches: matches,
      timestamp: new Date()
    };
    setHistory([historyEntry, ...history]);
    
    // Update players state with new games played count
    setPlayers([...players]);
    setRoundNumber(roundNumber + 1);
  };

  const getSkillColor = (skill: SkillLevel) => {
    switch (skill) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'pro-player': return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
              <Users className="w-7 h-7" />
              Badminton Matcher
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition"
                title="View history"
              >
                <History className="w-5 h-5 text-indigo-700" />
              </button>
              <button
                onClick={endDay}
                className="p-2 bg-red-100 rounded-lg hover:bg-red-200 transition"
                title="End day (clear all data)"
              >
                <RefreshCw className="w-5 h-5 text-red-700" />
              </button>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Courts
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={courts}
                onChange={(e) => setCourts(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Playing Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPlayingType('single')}
                  className={`flex-1 py-2 rounded-lg font-medium transition ${
                    playingType === 'single'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Single
                </button>
                <button
                  onClick={() => setPlayingType('double')}
                  className={`flex-1 py-2 rounded-lg font-medium transition ${
                    playingType === 'double'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Double
                </button>
              </div>
            </div>
          </div>

          {/* Add Player */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Add Player</h3>
              <button
                onClick={() => setAdvancedMode(!advancedMode)}
                className={`text-xs px-3 py-1 rounded-full transition ${
                  advancedMode 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {advancedMode ? 'Advanced' : 'Simple'}
              </button>
            </div>
            <input
              type="text"
              placeholder="Player name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {advancedMode && (
              <select
                value={playerSkill}
                onChange={(e) => setPlayerSkill(e.target.value as SkillLevel)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="pro-player">Pro Player</option>
              </select>
            )}
            <button
              onClick={addPlayer}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Player
            </button>
          </div>
        </div>

        {/* Players List */}
        {players.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Players ({players.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.isOnLeave ? 'bg-gray-200 opacity-60' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${player.isOnLeave ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {player.name}
                      </span>
                      {player.isOnLeave && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                          On Leave
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {advancedMode && (
                        <span className={`text-xs px-2 py-1 rounded ${getSkillColor(player.skill)}`}>
                          {player.skill}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {player.gamesPlayed} games
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleLeave(player.id)}
                      className={`p-2 rounded-lg transition ${
                        player.isOnLeave 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-orange-600 hover:bg-orange-50'
                      }`}
                      title={player.isOnLeave ? 'Mark as returned' : 'Mark as on leave'}
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={generateMatches}
              className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 font-medium"
            >
              <Play className="w-5 h-5" />
              Generate Matches
            </button>
          </div>
        )}

        {/* Current Matches */}
        {currentMatches.length > 0 && !showHistory && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Current Matches - Round {roundNumber - 1}
            </h3>
            <div className="space-y-3">
              {currentMatches.map((match) => (
                <div key={match.id} className="border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50">
                  <div className="text-sm font-bold text-indigo-900 mb-2">
                    Court {match.court}
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white p-2 rounded">
                      <div className="text-xs text-gray-500 mb-1">Team 1</div>
                      {match.team1.map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="font-medium text-sm">{p.name}</span>
                          {advancedMode && (
                            <span className={`text-xs px-2 py-0.5 rounded ${getSkillColor(p.skill)}`}>
                              {p.skill}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="text-center text-xs font-bold text-gray-500">VS</div>
                    <div className="bg-white p-2 rounded">
                      <div className="text-xs text-gray-500 mb-1">Team 2</div>
                      {match.team2.map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="font-medium text-sm">{p.name}</span>
                          {advancedMode && (
                            <span className={`text-xs px-2 py-0.5 rounded ${getSkillColor(p.skill)}`}>
                              {p.skill}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {showHistory && history.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Match History</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {history.map((entry, idx) => (
                <div key={idx} className="border-l-4 border-indigo-500 pl-4">
                  <div className="text-sm font-bold text-gray-900 mb-2">
                    Round {entry.round}
                    <span className="text-xs text-gray-500 ml-2">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {entry.matches.map((match) => (
                      <div key={match.id} className="bg-gray-50 p-3 rounded text-sm">
                        <div className="font-medium text-gray-700 mb-1">
                          Court {match.court}
                        </div>
                        <div className="text-xs text-gray-600">
                          {match.team1.map(p => p.name).join(' & ')}
                          <span className="mx-2">vs</span>
                          {match.team2.map(p => p.name).join(' & ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}