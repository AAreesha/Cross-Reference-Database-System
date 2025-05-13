// src/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // Update to your backend URL if hosted

/**
 * Insert a record into the unified index.
 * Expects an object with db1_id, db2_id, db3_id, db4_id (all strings).
 */
export const insertRecord = async ({ db1_id, db2_id, db3_id, db4_id }) => {
  const params = new URLSearchParams({ db1_id, db2_id, db3_id, db4_id });
  const res = await axios.post(`${API_BASE_URL}/insert-record/?${params.toString()}`);
  return res.data;
};

/**
 * Perform semantic search against the unified index.
 * @param {string} query - The search string.
 * @returns top 5 semantic matches
 */
export const semanticSearch = async (query) => {
  const res = await axios.post(`${API_BASE_URL}/semantic-search/`, null, {
    params: { query },
  });
  return res.data;
};


export const getSuggestions = async () => {
  const res = await axios.get(`${API_BASE_URL}/suggestions/`);
  return res.data.suggestions || [];
};
