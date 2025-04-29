import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';  // Use `useNavigate` instead of `useHistory`


// Define a type for the Policy (based on the server model)
interface Policy {
  id: string;
  credits: number;
  type: string;
}

const UpdatePolicy: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedCredits, setUpdatedCredits] = useState<number>(0);
  const navigate = useNavigate();  // Replace `useHistory` with `useNavigate`

  // Fetch policies from the server
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await axios.get<Policy[]>('http://localhost:5000/api/policies');
        setPolicies(response.data);
      } catch (err) {
        setError('Error fetching policies');
        console.error(err);
      }
    };
    fetchPolicies();
  }, []);

  // Handle policy selection
  const handlePolicySelection = (policy: Policy) => {
    setSelectedPolicy(policy);
    setUpdatedCredits(policy.credits);  // Pre-fill the credits field with the selected policy's credits
  };

  // Handle the change in credits
  const handleCreditsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdatedCredits(Number(e.target.value));
  };

  // Submit the updated policy
  const handleUpdate = async () => {
    if (!selectedPolicy) {
      setError('Please select a policy first');
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:5000/api/policies/${selectedPolicy.id}`,
        {
          credits: updatedCredits,
          type: selectedPolicy.type,  // Assuming you're updating only the credits
        }
      );
      alert('Policy updated successfully!');
      navigate('/admin/policies');  // Redirect to the policies list page after update
    } catch (err) {
      setError('Error updating policy');
      console.error(err);
    }
  };

  return (
    <div>
      <h1>Update Policy</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        <h2>Select a Policy to Update</h2>
        {policies.length === 0 ? (
          <p>Loading policies...</p>
        ) : (
          <div>
            {policies.map((policy) => (
              <div key={policy.id}>
                <button onClick={() => handlePolicySelection(policy)}>
                  {policy.type} - {policy.credits} Credits
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPolicy && (
        <div>
          <h3>Update Credits for {selectedPolicy.type}</h3>
          <input
            type="number"
            value={updatedCredits}
            onChange={handleCreditsChange}
            min="0"
          />
          <button onClick={handleUpdate}>Update Policy</button>
        </div>
      )}
    </div>
  );
};

export default UpdatePolicy;
