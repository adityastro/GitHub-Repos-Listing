
document.addEventListener('DOMContentLoaded', function () {
    console.log('Script loaded successfully.');

    window.changePage = function (page) {
        const username = document.getElementById('searchInput').value;
        if (username.trim() !== '') {
            fetchGitHubData(username, page);
        }
    };

    function showLoader() {
        const loaderContainer = document.getElementById('loader-container');
        loaderContainer.style.display = 'flex';
    }

    function hideLoader() {
        const loaderContainer = document.getElementById('loader-container');
        loaderContainer.style.display = 'none';
    }

    async function searchUser() {
        const username = document.getElementById('searchInput').value;
        if (username.trim() !== '') {
            fetchGitHubData(username);
        }
    }

    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', searchUser);
    }

    async function fetchGitHubData(username, page = 1, perPage = 10) {
        showLoader();
    
        const userUrl = `https://api.github.com/users/${username}`;
        const reposUrl = `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`;
    
        try {
            const [userResponse, reposResponse] = await Promise.all([
                fetch(userUrl),
                fetch(reposUrl)
            ]);
    
            if (!userResponse.ok) {
                throw new Error(`GitHub API request failed for user: ${userResponse.status} ${userResponse.statusText}`);
            }
    
            if (!reposResponse.ok) {
                throw new Error(`GitHub API request failed for repos: ${reposResponse.status} ${reposResponse.statusText}`);
            }
    
            const userData = await userResponse.json();
            const reposData = await reposResponse.json();
    
            if (!Array.isArray(reposData)) {
                throw new Error('Invalid response from GitHub API (repos)');
            }
    
            console.log('GitHub API User Response:', userData);
            console.log('GitHub API Repos Response:', reposData);
    
            
            const totalRepositories = reposData.length;
            const totalPages = Math.ceil(totalRepositories / perPage);
    
            
            const startIndex = (page - 1) * perPage;
            const endIndex = Math.min(startIndex + perPage, totalRepositories);
    
            const repositoriesToDisplay = reposData.slice(startIndex, endIndex);
    
            updateUserInformation(userData);
            await updateRepositoryList(repositoriesToDisplay); 
            console.log('Total Repositories:', totalRepositories);
            console.log('Total Pages:', totalPages);
            updatePagination(page, totalPages);
        } catch (error) {
            console.error('Error fetching data:', error);
            updateUserInformation({});
            updateRepositoryList([]);
            updatePagination(0, 0);
        } finally {
            hideLoader(); 
        }
    }
    
    async function updateUserInformation(userData) {
        const userInfoSection = document.getElementById('user-info');
        userInfoSection.innerHTML = `
            <img src="${userData.avatar_url || 'placeholder.jpg'}" alt="${userData.login || 'Username not available'} avatar" class="img-fluid mb-2">
            <h2>${userData.login || 'Username not available'}</h2>
            <p>Location: ${userData.location || 'Location not available'}</p>
            <p>Bio: ${userData.bio || 'Bio not available'}</p>
            <p>Links:
                <a href="${userData.html_url}" target="_blank">GitHub</a>
                ${userData.blog ? `<a href="${userData.blog}" target="_blank">Blog</a>` : ''}
                ${userData.twitter_username ? `<a href="https://twitter.com/${userData.twitter_username}" target="_blank">Twitter</a>` : ''}
            </p>
        `;
    }

    async function updateRepositoryList(repositories) {
        const repoListSection = document.getElementById('repo-list');
    
        
        const repoWithLanguages = await Promise.all(repositories.map(async (repo) => {
            const languagesUrl = repo.languages_url;
            try {
                const response = await fetch(languagesUrl);
                if (!response.ok) {
                    throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
                }
                const languagesData = await response.json();
                return { ...repo, languages: Object.keys(languagesData) };
            } catch (error) {
                console.error('Error fetching languages for repo:', error);
                return { ...repo, languages: [] }; 
            }
        }));
    
        
        repoListSection.innerHTML = repoWithLanguages.map(repo => `
            <div class="repo-box">
                <h3>${repo.name}</h3>
                <p>${repo.description || 'No description available'}</p>
                <div class="languages">
                    ${repo.languages.map(language => `<div class="language-box">${language}</div>`).join('')}
                </div>
            </div>
        `).join('');
    }
    

    function updatePagination(currentPage, totalPages) {
        const paginationSection = document.getElementById('pagination');
        paginationSection.innerHTML = totalPages > 1 ? `
            <nav aria-label="Page navigation">
                <ul class="pagination">
                    ${Array.from({ length: totalPages }, (_, i) => `
                        <li class="page-item ${currentPage === i + 1 ? 'active' : ''}">
                            <a class="page-link" href="#" onclick="window.changePage(${i + 1})">${i + 1}</a>
                        </li>
                    `).join('')}
                </ul>
            </nav>` : '';
    }

    fetchGitHubData('adityastro'); 
});

