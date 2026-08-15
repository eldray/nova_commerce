import React, { useState } from 'react';
import { useDomains, useAddDomain, useVerifyDomain, useDeleteDomain } from '../helpers/useDomains';
import './dashboard.domains.module.css';

export const DashboardDomains: React.FC = () => {
  const [newDomain, setNewDomain] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const { data: domains, isLoading, error, refetch } = useDomains();
  const addDomainMutation = useAddDomain();
  const verifyDomainMutation = useVerifyDomain();
  const deleteDomainMutation = useDeleteDomain();

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDomain.trim()) return;

    try {
      await addDomainMutation.mutateAsync({ domain: newDomain.trim() });
      setNewDomain('');
      setShowAddModal(false);
      alert('Domain added! Please configure your DNS records to verify ownership.');
    } catch (err: any) {
      alert(err.message || 'Failed to add domain');
    }
  };

  const handleVerify = async (domainId: number) => {
    try {
      await verifyDomainMutation.mutateAsync({ domainId });
      alert('Domain verified successfully!');
      refetch();
    } catch (err: any) {
      alert(err.message || 'DNS records not configured yet. Please check your DNS settings.');
    }
  };

  const handleDelete = async (domainId: number, domain: string) => {
    if (!confirm(`Are you sure you want to remove ${domain}? This will disconnect your custom domain.`)) {
      return;
    }

    try {
      await deleteDomainMutation.mutateAsync(domainId);
      alert('Domain removed successfully');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to delete domain');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'verified':
        return 'statusBadge verified';
      case 'pending':
        return 'statusBadge pending';
      case 'failed':
        return 'statusBadge failed';
      default:
        return 'statusBadge';
    }
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading domains...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">
          <h2>Error Loading Domains</h2>
          <p>{(error as Error).message}</p>
          <button onClick={() => refetch()} className="retryButton">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Custom Domains</h1>
        <p>Connect your own domain to give your store a professional brand identity</p>
      </div>

      <div className="infoBanner">
        <div className="infoIcon">ℹ️</div>
        <div className="infoContent">
          <h3>How Custom Domains Work</h3>
          <p>
            Add your domain (e.g., mystore.com), then configure DNS records at your domain registrar.
            Once verified, customers can access your store at your custom domain instead of the default subdomain.
          </p>
        </div>
      </div>

      <div className="actionBar">
        <button 
          className="addButton" 
          onClick={() => setShowAddModal(true)}
          disabled={domains && domains.some(d => d.status === 'verified')}
        >
          + Add Custom Domain
        </button>
        {domains && domains.some(d => d.status === 'verified') && (
          <span className="limitNotice">You already have a verified domain. Remove it to add a new one.</span>
        )}
      </div>

      {domains && domains.length > 0 ? (
        <div className="domainsList">
          {domains.map((domain) => (
            <div key={domain.id} className="domainCard">
              <div className="domainHeader">
                <div className="domainInfo">
                  <h3>{domain.domain}</h3>
                  <span className={getStatusBadgeClass(domain.status)}>
                    {domain.status.toUpperCase()}
                  </span>
                </div>
                <div className="domainActions">
                  {domain.status === 'pending' && (
                    <button 
                      className="verifyButton"
                      onClick={() => handleVerify(domain.id)}
                      disabled={verifyDomainMutation.isPending}
                    >
                      {verifyDomainMutation.isPending ? 'Verifying...' : 'Verify Now'}
                    </button>
                  )}
                  <button 
                    className="deleteButton"
                    onClick={() => handleDelete(domain.id, domain.domain)}
                    disabled={deleteDomainMutation.isPending}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="domainDetails">
                <div className="detailRow">
                  <span className="label">Status:</span>
                  <span className="value">{domain.isActive ? 'Active' : 'Not Active'}</span>
                </div>
                <div className="detailRow">
                  <span className="label">SSL:</span>
                  <span className="value">{domain.sslEnabled ? 'Enabled ✅' : 'Not Enabled'}</span>
                </div>
                <div className="detailRow">
                  <span className="label">Store URL:</span>
                  <a href={domain.storeUrl} target="_blank" rel="noopener noreferrer" className="storeLink">
                    {domain.storeUrl}
                  </a>
                </div>
                <div className="detailRow">
                  <span className="label">Added:</span>
                  <span className="value">{new Date(domain.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {domain.status === 'pending' && (
                <div className="dnsInstructions">
                  <h4>📋 DNS Configuration Required</h4>
                  <p>Add these records at your domain registrar:</p>
                  
                  <div className="dnsRecords">
                    <div className="dnsRecord">
                      <div className="recordHeader">
                        <span className="recordType">CNAME</span>
                        <span className="recordHost">{domain.dnsInstructions.cname.host}</span>
                      </div>
                      <div className="recordValue">
                        <code>{domain.dnsInstructions.cname.value}</code>
                      </div>
                      <div className="recordStatus">
                        {domain.dnsInstructions.cname.configured ? '✅ Configured' : '⏳ Pending'}
                      </div>
                    </div>

                    <div className="dnsRecord">
                      <div className="recordHeader">
                        <span className="recordType">TXT</span>
                        <span className="recordHost">{domain.dnsInstructions.txt.host}</span>
                      </div>
                      <div className="recordValue">
                        <code>{domain.dnsInstructions.txt.value}</code>
                      </div>
                      <div className="recordStatus">
                        {domain.dnsInstructions.txt.configured ? '✅ Configured' : '⏳ Pending'}
                      </div>
                    </div>
                  </div>

                  <div className="dnsHelp">
                    <p><strong>Note:</strong> DNS changes can take 5-30 minutes to propagate. After adding the records, click "Verify Now".</p>
                  </div>
                </div>
              )}

              {domain.status === 'verified' && (
                <div className="successMessage">
                  <p>✅ Your custom domain is active and ready to use!</p>
                  <p>Customers can now access your store at <strong>{domain.domain}</strong></p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="emptyState">
          <div className="emptyIcon">🌐</div>
          <h3>No Custom Domains Yet</h3>
          <p>Add a custom domain to give your store a professional branded URL</p>
          <button className="addButton" onClick={() => setShowAddModal(true)}>
            Add Your First Domain
          </button>
        </div>
      )}

      {showAddModal && (
        <div className="modalOverlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Custom Domain</h2>
            <form onSubmit={handleAddDomain}>
              <div className="formGroup">
                <label htmlFor="domain">Domain Name</label>
                <input
                  id="domain"
                  type="text"
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  required
                  pattern="^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$"
                  title="Please enter a valid domain name (e.g., example.com)"
                />
                <small>Enter your domain without www or https://</small>
              </div>

              <div className="modalFooter">
                <button 
                  type="button" 
                  className="cancelButton"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submitButton"
                  disabled={addDomainMutation.isPending || !newDomain.trim()}
                >
                  {addDomainMutation.isPending ? 'Adding...' : 'Add Domain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
