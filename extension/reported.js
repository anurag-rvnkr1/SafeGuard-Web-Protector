
        document.addEventListener('DOMContentLoaded', () => {
            loadReportedSites();
            
            document.getElementById('backBtn').addEventListener('click', () => {
                window.close();
            });
        });

        async function loadReportedSites() {
            try {
                const reportedSites = await new Promise((resolve) => {
                    chrome.runtime.sendMessage({ action: "getReportedSites" }, resolve);
                });

                displayReportedSites(reportedSites);
            } catch (error) {
                console.error('Error loading reported sites:', error);
                document.getElementById('reportedContainer').innerHTML = `
                    <div class="empty-state">
                        <h3>Error loading reported sites</h3>
                        <p>Please try refreshing the page.</p>
                    </div>
                `;
            }
        }

        function displayReportedSites(sites) {
            const container = document.getElementById('reportedContainer');
            
            document.getElementById('reportedCount').textContent = sites.length;

            if (sites.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>No sites reported yet</h3>
                        <p>When you report malicious sites, they will appear here and be blocked for all users.</p>
                    </div>
                `;
                return;
            }

            // Sort by most recent first
            sites.sort((a, b) => b.timestamp - a.timestamp);

            container.innerHTML = sites.map(site => `
                <div class="reported-item">
                    <div class="site-info">
                        <div class="domain">${site.domain}</div>
                        <div class="url">${site.url}</div>
                        <div class="report-details">
                            Reported as: <strong>${formatReason(site.reason)}</strong>
                            <span class="report-reason">${site.reason}</span>
                        </div>
                        <div class="timestamp">
                            Reported on ${new Date(site.timestamp).toLocaleString()}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function formatReason(reason) {
            const reasons = {
                'phishing': 'Phishing Site',
                'malware': 'Malware Distribution',
                'scam': 'Scam/Fraud',
                'fake': 'Fake/Impersonation',
                'other': 'Other Malicious Activity'
            };
            return reasons[reason] || reason;
        }