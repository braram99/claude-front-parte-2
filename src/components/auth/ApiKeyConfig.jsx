// src/components/auth/ApiKeyConfig.jsx
import React, { useState } from 'react';
import { X, Key, TestTube, Save, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button, Card } from '../ui';

const ApiKeyConfig = ({ onClose, onSave }) => {
  const [tempKey, setTempKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Test API key with actual request
  const handleTest = async () => {
    if (!tempKey.trim()) {
      setTestResult({ 
        success: false, 
        message: 'Please enter an API key first' 
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tempKey.trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'English Practice App'
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet",
          messages: [
            {
              role: "user",
              content: "Test message - just respond with 'API key works!'"
            }
          ],
          max_tokens: 10
        })
      });

      if (response.ok) {
        setTestResult({ 
          success: true, 
          message: 'API key works perfectly! ✅' 
        });
      } else if (response.status === 401) {
        setTestResult({ 
          success: false, 
          message: 'Invalid API key. Please check your key.' 
        });
      } else if (response.status === 429) {
        setTestResult({ 
          success: false, 
          message: 'Rate limit exceeded. API key might be valid but limited.' 
        });
      } else {
        setTestResult({ 
          success: false, 
          message: `API error: ${response.status}` 
        });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Network error: ${error.message}` 
      });
    } finally {
      setTesting(false);
    }
  };

  // Save API key
  const handleSave = async () => {
    if (!tempKey.trim()) {
      setTestResult({ 
        success: false, 
        message: 'Please enter an API key first' 
      });
      return;
    }

    setSaving(true);
    
    try {
      localStorage.setItem('openrouter_api_key', tempKey.trim());
      setTestResult({ 
        success: true, 
        message: 'API key saved successfully!' 
      });
      
      setTimeout(() => {
        if (onSave) onSave();
        onClose();
      }, 1500);
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: 'Failed to save API key' 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Key className="text-blue-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">Configure OpenRouter API</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            icon={X}
            className="text-gray-500 hover:text-gray-700"
          />
        </div>
        
        {/* Instructions */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">🚀 Unlock Real AI Analysis</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Get your API key from <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="underline">OpenRouter.ai</a></p>
            <p>• Enable Claude 3.5 Sonnet for intelligent conversation analysis</p>
            <p>• Your key is stored locally and never shared</p>
          </div>
        </div>
        
        {/* API Key Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenRouter API Key
            </label>
            <input
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleTest()}
            />
          </div>
          
          {/* Test Result */}
          {testResult && (
            <div className={`p-3 rounded-lg text-sm flex items-start space-x-2 ${
              testResult.success 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {testResult.success ? (
                <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleTest}
              disabled={testing || !tempKey.trim()}
              loading={testing}
              icon={TestTube}
              className="w-full"
              variant="secondary"
            >
              {testing ? 'Testing API Key...' : '🧪 Test API Key'}
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={!tempKey.trim() || saving}
              loading={saving}
              icon={Save}
              className="w-full"
              variant="primary"
            >
              {saving ? 'Saving...' : '💾 Save API Key'}
            </Button>
          </div>

          {/* Skip Option */}
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500"
            >
              Skip for now (Practice Mode)
            </Button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            🔒 Your API key is stored locally in your browser and never sent to our servers
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ApiKeyConfig;
