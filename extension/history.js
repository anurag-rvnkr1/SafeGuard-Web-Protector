document.addEventListener('DOMContentLoaded', () => {
            loadHistory();
            
            document.getElementById('backBtn').addEventListener('click', () => {
                window.close();
            });
        });

        async function loadHistory() {
            try {
                const history = await new Promise((resolve) => {
                    chrome.runtime.sendMessage({ action: "getBlockedSitesHistory" }, resolve);
                });

                displayStats(history);
                displayHistory(history.sites);
            } catch (error) {
                console.error('Error loading history:', error);
                document.getElementById('historyContainer').innerHTML = `
                    <div class="empty-state">
                        <h3>Error loading history</h3>
                        <p>Please try refreshing the page.</p>
                    </div>
                `;
            }
        }

        function displayStats(history) {
            const sites = history.sites || [];
            const totalAttempts = sites.reduce((sum, site) => sum + site.totalAttempts, 0);
            const maliciousSites = sites.filter(site => site.reason === 'malicious').length;
            const inappropriateSites = sites.filter(site => site.reason === 'inappropriate').length;

            document.getElementById('totalSites').textContent = sites.length;
            document.getElementById('totalAttempts').textContent = totalAttempts;
            document.getElementById('maliciousSites').textContent = maliciousSites;
            document.getElementById('inappropriateSites').textContent = inappropriateSites;
        }

        function displayHistory(sites) {
            const container = document.getElementById('historyContainer');

            if (sites.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>No blocked sites yet</h3>
                        <p>When sites are blocked, they will appear here with detailed access history.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = sites.map((site, index) => `
                <div class="history-item">
                    <div class="history-header" onclick="toggleDetails(${index})">
                        <div class="domain-info">
                            <div class="domain-name">${site.domain}</div>
                            <div class="domain-stats">
                                ${site.totalAttempts} attempt${site.totalAttempts !== 1 ? 's' : ''} • 
                                Last: ${new Date(site.lastAttempt).toLocaleDateString()}
                            </div>
                        </div>
                        <div class="block-reason reason-${site.reason}">
                            ${site.reason === 'malicious' ? 'Malicious' : 'Inappropriate'}
                        </div>
                        <div class="expand-icon" id="icon-${index}">▼</div>
                    </div>
                    <div class="history-details" id="details-${index}">
                        <h4>Access Attempts (${site.urls.length})</h4>
                        <div class="url-list">
                            ${site.urls.map(urlData => `
                                <div class="url-item">
                                    <div class="url">${urlData.url}</div>
                                    <div class="timestamp">
                                        ${new Date(urlData.timestamp).toLocaleString()} • 
                                        Blocked as: ${urlData.reason}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function toggleDetails(index) {
            const details = document.getElementById(`details-${index}`);
            const icon = document.getElementById(`icon-${index}`);
            
            if (details.classList.contains('expanded')) {
                details.classList.remove('expanded');
                icon.style.transform = 'rotate(0deg)';
            } else {
                details.classList.add('expanded');
                icon.style.transform = 'rotate(180deg)';
            }
        }