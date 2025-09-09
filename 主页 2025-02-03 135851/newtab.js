// 在文件顶部添加防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 显示提示信息的函数
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show';

    setTimeout(() => {
        toast.className = 'toast';
    }, duration);
}

// 添加模块项目的右键菜单函数
function showModuleContextMenu(e, element) {
    const contextMenu = document.getElementById('contextMenu');
    contextMenu.innerHTML = '';
    const ul = document.createElement('ul');
    
    // 创建菜单项，只保留新窗口打开、删除和复制功能
    ul.innerHTML = `
        <li id="openNew">
            <img src="/img/open_new.svg" class="menu-icon" alt="">
            在新窗口中打开
        </li>
        <li id="copyUrl">
            <img src="/img/copy.svg" class="menu-icon" alt="">
            复制网址
        </li>
        <hr>
        <li id="delete">
            <img src="/img/delete.svg" class="menu-icon" alt="">
            删除
        </li>
    `;
    
    contextMenu.appendChild(ul);
    
    // 先显示菜单但设为不可见
    contextMenu.style.visibility = 'hidden';
    contextMenu.style.display = 'block';

    // 获取菜单和视窗的尺寸
    const menuRect = contextMenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 计算最佳位置
    const x = Math.min(
        Math.max(10, e.clientX),
        viewportWidth - menuRect.width - 10
    );
    
    const y = Math.min(
        Math.max(10, e.clientY),
        viewportHeight - menuRect.height - 10
    );

    // 应用位置并显示菜单
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.visibility = 'visible';

    // 保存相关元素引用
    contextMenu.relatedTarget = element;
    
    // 修改模块右键菜单项点击事件处理
    contextMenu.querySelectorAll('li').forEach(item => {
        item.onclick = (e) => {
            e.stopPropagation();
            handleModuleContextMenuAction(item.id, element);
            contextMenu.style.display = 'none';
            contextMenu.relatedTarget = null;
        };
    });
}

// 处理模块项目的右键菜单动作
function handleModuleContextMenuAction(action, element) {
    const url = element.dataset.url;
    const id = element.dataset.id;
    
    switch (action) {
        case 'openNew':
            window.open(url, '_blank');
            break;
        
        case 'copyUrl':
            navigator.clipboard.writeText(url).then(() => {
                showToast('网址已复制到剪贴板', 1500);
            }).catch(err => {
                console.error('复制失败:', err);
                showToast('复制失败，请重试', 3000);
            });
            break;
        
        case 'delete':
            if (confirm('确定要从列表中移除此项吗？')) {
                // 获取模块列表和模块ID
                const moduleList = element.closest('.module-content');
                const moduleId = moduleList?.closest('.module').id;
                
                // 从列表中移除元素并清除高亮
                element.remove();
                showToast('已从列表中移除');
                
                // 如果是最近添加的书签模块，重新获取最近的书签
                if (moduleId === 'recentBookmarksModule') {
                    fetchBookmarks().then(bookmarks => {
                        refreshModuleList(moduleList, bookmarks);
                    });
                }
                // 如果是经常访问的网站模块，重新获取列表
                else if (moduleId === 'topSitesModule') {
                    fetchFrequentBookmarks().then(sites => {
                        refreshModuleList(moduleList, sites);
                    });
                }
            }
            break;
    }
}

// 刷新模块列表的辅助函数
function refreshModuleList(moduleList, items) {
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
        fragment.appendChild(createListItem(item));
    });
    moduleList.innerHTML = '';
    moduleList.appendChild(fragment);
}

// 修改文档点击事件处理程序
document.addEventListener('click', function(event) {
    const contextMenu = document.getElementById('contextMenu');
    const moveDialog = document.getElementById('moveDialog');
    const editDialog = document.getElementById('editDialog');
    const confirmDialog = document.getElementById('confirmDialog');
    
    // 如果点击的是右键菜单本身，不做任何处理
    if (contextMenu.contains(event.target)) {
        return;
    }
    
    // 如果任何对话框是打开状态，不清除高亮
    if (moveDialog?.style.display === 'flex' || 
        editDialog?.style.display === 'flex' || 
        confirmDialog?.style.display === 'flex') {
        // 只隐藏右键菜单
        contextMenu.style.display = 'none';
        return;
    }
    
    // 双击空白处时清除高亮（使用事件的detail属性检测双击）
    if (event.detail === 2 && 
        !event.target.closest('.bookmark-item') && 
        !event.target.closest('.module-content li')) {
        clearAllHighlights();
    }
    
    // 隐藏右键菜单
    contextMenu.style.display = 'none';
    contextMenu.relatedTarget = null;
});

// 添加模块容器的右键菜单处理
document.querySelectorAll('.module-content').forEach(moduleContent => {
    moduleContent.addEventListener('contextmenu', function(event) {
        const listItem = event.target.closest('li');
        if (!listItem) {
            event.preventDefault();
            event.stopPropagation();
            clearAllHighlights();
            const contextMenu = document.getElementById('contextMenu');
            contextMenu.style.display = 'none';
            return;
        }
        
        event.preventDefault();
        event.stopPropagation();
        
        // 清除所有高亮
        clearAllHighlights();
        
        // 添加高亮
        listItem.classList.add('highlgg');
        
        // 显示右键菜单
        showModuleContextMenu(event, listItem);
    });
});

// 获取图标 URL 的函数
function getIconUrl(url) {
    return `/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`; // 生成图标的 URL
}

// 创建列表项的函数
function createListItem(item) {
    const li = document.createElement('li');
    li.dataset.id = item.id;  // 添加 ID
    li.dataset.url = item.url;  // 添加 URL
    
    const img = document.createElement('img');
    img.src = getIconUrl(item.url);
    img.className = 'size-16 mr-2';
    img.onerror = () => img.src = "/img/ic_tab_black_24px.svg";
    
    const a = document.createElement('a');
    a.href = item.url;
    a.textContent = item.title || item.url;
    a.target = '_blank';
    
    li.appendChild(img);
    li.appendChild(a);
    
    // 修改右键菜单事件
    li.addEventListener('contextmenu', function(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // 清除所有高亮
        clearAllHighlights();
        
        // 添加高亮
        li.classList.add('highlgg');
        
        // 显示右键菜单
        showModuleContextMenu(event, li);
    });
    
    return li;
}

// 添加清除所有高亮的函数
function clearAllHighlights() {
    document.querySelectorAll('.bookmark-item.highlgg, .module-content li.highlgg').forEach(item => {
        item.classList.remove('highlgg');
    });
}

// 在文件顶部定义这些函数，使其在全局范围内可用
// 获取最近书签的函数
const fetchBookmarks = () => new Promise(resolve => chrome.bookmarks.getRecent(20, resolve));

// 获取常用网站的函数
const fetchFrequentBookmarks = () => new Promise(resolve => {
    chrome.history.search({ text: '', maxResults: 100 }, (historyItems) => {
        const frequentUrls = historyItems
            .filter(item => item.url && item.visitCount > 7)
            .map(item => ({ url: item.url, title: item.title }))
            .slice(0, 7);
        resolve(frequentUrls);
    });
});

// 添加模块加载状态标记
let modulesLoaded = false;

// 修改延迟加载函数
async function lazyLoadModule(moduleElement, fetchFunction, createListItem) {
    const listElement = moduleElement.querySelector('.module-content');
    if (!listElement) return;

    try {
        // 添加加载提示
        listElement.innerHTML = '<div class="loading">加载中...</div>';
        
        const items = await fetchFunction();
        
        // 创建文档片段提高性能
        const fragment = document.createDocumentFragment();
        items.forEach(item => fragment.appendChild(createListItem(item)));
        
        // 清除加载提示并添加内容
        listElement.innerHTML = '';
        listElement.appendChild(fragment);
    } catch (error) {
        console.error('加载模块数据失败:', error);
        listElement.innerHTML = '<div class="loading error">加载失败，请重试</div>';
    }
}

// 修改初始化垂直模块的显示状态
(() => {
    const verticalModules = document.querySelector('.vertical-modules');
    const headerImage = document.getElementById('headerImage');
    const mainContainer = document.querySelector('.main-container');
    const toggleVerticalBtn = document.getElementById('toggleVerticalModules');

    let isModuleVisible = false;
    let hoverTimeout;

    // 添加加载模块的函数
    const loadModules = async () => {
        if (modulesLoaded) return;
        
        const recentModule = document.getElementById('recentBookmarksModule');
        const topSitesModule = document.getElementById('topSitesModule');
        
        // 并行加载两个模块
        await Promise.all([
            lazyLoadModule(recentModule, fetchBookmarks, createListItem),
            lazyLoadModule(topSitesModule, fetchFrequentBookmarks, createListItem)
        ]);
        
        modulesLoaded = true;
    };

    // 显示模块
    const showModules = () => {
        if (!isModuleVisible) {
            verticalModules.style.display = 'flex';
            loadModules();
            isModuleVisible = true;
            toggleVerticalBtn.classList.add('active');
        }
    };

    // 隐藏模块
    const hideModules = () => {
        if (isModuleVisible) {
            verticalModules.style.display = 'none';
            isModuleVisible = false;
            toggleVerticalBtn.classList.remove('active');
        }
    };

    if (verticalModules && headerImage && mainContainer && toggleVerticalBtn) {
        // 初始状态
        verticalModules.style.display = 'none';
        headerImage.style.display = 'block';
        mainContainer.style.height = 'calc(100vh - 65px)';

        // 切换按钮点击事件
        toggleVerticalBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isModuleVisible) {
                hideModules();
            } else {
                showModules();
            }
        });

        // 鼠标进入按钮时显示模块
        toggleVerticalBtn.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(showModules, 870);
        });

        // 鼠标离开按钮时取消显示
        toggleVerticalBtn.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimeout);  // 清除定时器，防止模块显示
        });

        // 模块区域的事件处理
        verticalModules.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimeout);
        });

        // 点击模块内部时阻止冒泡，防止触发外部点击事件
        verticalModules.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // 点击页面其他区域时隐藏模块
        document.addEventListener('click', (e) => {
            if (!verticalModules.contains(e.target) && 
                !toggleVerticalBtn.contains(e.target) && 
                isModuleVisible) {
                hideModules();
            }
        });

        // 右键菜单显示时不隐藏模块
        document.addEventListener('contextmenu', (e) => {
            if (verticalModules.contains(e.target)) {
                e.stopPropagation();
            }
        });

        // ESC键隐藏模块
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isModuleVisible) {
                hideModules();
            }
        });

        // 在页面隐藏时清理
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                clearTimeout(hoverTimeout);
                modulesLoaded = false;
            }
        });
    }
})();

// 在文件顶部添加全局变量
let isResizing = false;
let currentResizer = null;
let startX = 0;
let startWidth = 0;
let hoveredBookmark = null;  // 跟踪鼠标悬停的书签
let previewWindow = null;    // 跟踪预览窗口

// 在文件顶部添加常量
const WINDOW_SETTINGS = {
    widthRatio: 0.8,
    heightRatio: 0.8,
    minWidth: 800,
    minHeight: 600
};

// 在文件顶部添加顶部书签栏拖动相关变量
let topBarDraggedItem = null;
let topBarDraggedRect = null;

// 当 DOM 内容加载完成后执行以下代码
document.addEventListener('DOMContentLoaded', async function () {
    // 获取上下文菜单和书签容器元素
    const contextMenu = document.getElementById('contextMenu');
    const bookmarkContainer = document.getElementById('bookmarkContainer');

    // 优先加载书签树
    chrome.bookmarks.getTree(function (bookmarks) {
        displayBookmarks(bookmarks);
    });

    // 延迟加载右键菜单图标
    const menuIconsToLoad = [
        'open.svg', 'open_new.svg', 'move.svg', 'rename.svg', 
        'delete.svg', 'folder.svg', 'sort_asc.svg', 'sort_desc.svg',
        'copy.svg', 'edit.svg'
    ];
    
    function preloadMenuIcons() {
        menuIconsToLoad.forEach(icon => {
            const img = new Image();
            img.src = `/img/${icon}`;
        });
    }
    
    // 当用户第一次右键点击时才加载菜单图标
    let menuIconsLoaded = false;
    document.addEventListener('contextmenu', function() {
        if (!menuIconsLoaded) {
            preloadMenuIcons();
            menuIconsLoaded = true;
        }
    }, { once: true });

    // 修改展示书签的函数
    function displayBookmarks(bookmarks) {
        // 直接清空并重新渲染书签容器，不保存任何状态
        bookmarkContainer.innerHTML = '';
        const bookmarksBar = bookmarks[0].children[0];
        if (bookmarksBar) {
            renderBookmarks(bookmarksBar.children, bookmarkContainer, 0);
        }
    }

    // 修改渲染书签的函数
    function renderBookmarks(bookmarks, parentElement, level, openFolderIds = new Set()) {
        let column = parentElement.querySelector(`.bookmark-column[data-level="${level}"]`);
        let currentlyHighlighted = null;
        let hoverTimeout;

        if (!column) {
            column = document.createElement('div');
            column.className = 'bookmark-column';
            column.dataset.level = level;
            parentElement.appendChild(column);
        } else {
            // 保存当前列的高亮项
            const highlightedItem = column.querySelector('.bookmark-item.highlighted');
            if (highlightedItem) {
                currentlyHighlighted = highlightedItem;
            }
            column.innerHTML = '';
        }

        // 创建一个文档片段来存储所有书签元素
        const fragment = document.createDocumentFragment();
        const items = [];

        // 清除比当前层级高的所有后续层级
        const columnsToRemove = [];
        parentElement.querySelectorAll('.bookmark-column').forEach(col => {
            if (parseInt(col.dataset.level) > level) {
                columnsToRemove.push(col);
            }
        });
        columnsToRemove.forEach(col => col.remove());

        // 直接使用原始书签数组进行渲染
        bookmarks.forEach(bookmark => {
            const item = document.createElement('div');
            item.className = 'bookmark-item';
            item.dataset.id = bookmark.id;
            item.dataset.url = bookmark.url || '';
            item.dataset.index = bookmark.index;

            // 设置列的 folderid
            if (!bookmark.url) {
                column.dataset.folderid = bookmark.id;
            }

            const icon = document.createElement('img');
            icon.className = 'bookmark-icon';
            icon.src = bookmark.children ? '/img/folder_icon.svg' : getIconUrl(bookmark.url);
            icon.onerror = () => icon.src = '/img/folder_icon.svg';

            const title = document.createElement('span');
            title.textContent = sanitizeText(bookmark.title || 'No Title');
            title.className = 'bookmark-title';

            item.appendChild(icon);
            item.appendChild(title);
            items.push(item);

            // 如果是链接，设置点击事件
            if (bookmark.url) {
                item.style.cursor = 'pointer';
                item.setAttribute('role', 'link');
                item.setAttribute('aria-selected', 'false');
                item.onclick = () => {
                    // 防止重复点击
                    if (item.classList.contains('highlgg')) {
                        window.open(bookmark.url, '_blank');
                        return;
                    }
                    setHighlight(item);
                    window.open(bookmark.url, '_blank');
                };
                item.addEventListener('mouseenter', () => {
                    hoveredBookmark = item;
                });
                item.addEventListener('mouseleave', () => {
                    hoveredBookmark = null;
                });
            } else if (bookmark.children) {
                item.style.cursor = 'pointer';
                
                // 点击处理
                item.onclick = () => {
                    clearTimeout(hoverTimeout);
                    
                    // 如果点击的是当前高亮的文件夹，则关闭它
                    if (currentlyHighlighted === item) {
                        item.classList.remove('highlighted');
                        currentlyHighlighted = null;
                        // 移除后续列
                        const nextColumns = [];
                        let nextColumn = column.nextElementSibling;
                        while (nextColumn) {
                            nextColumns.push(nextColumn);
                            nextColumn = nextColumn.nextElementSibling;
                        }
                        nextColumns.forEach(col => col.remove());
                        return;
                    }

                    // 移除同级其他文件夹的高亮
                    if (currentlyHighlighted && currentlyHighlighted !== item) {
                        currentlyHighlighted.classList.remove('highlighted');
                    }

                    item.classList.add('highlighted');
                    currentlyHighlighted = item;
                    openFolderIds.add(bookmark.id);
                    renderBookmarks(bookmark.children, parentElement, level + 1, openFolderIds);
                };

                // 悬停处理
                item.onmouseenter = () => {
                    // 如果右键菜单打开，不触发悬停展开
                    if (document.body.dataset.contextMenuOpen) return;
                    
                    clearTimeout(hoverTimeout);
                    hoverTimeout = setTimeout(() => {
                        if (currentlyHighlighted && currentlyHighlighted !== item) {
                            currentlyHighlighted.classList.remove('highlighted');
                        }
                        item.classList.add('highlighted');
                        currentlyHighlighted = item;
                        openFolderIds.add(bookmark.id);
                        renderBookmarks(bookmark.children, parentElement, level + 1, openFolderIds);
                    }, 500);
                };
                
                item.onmouseleave = () => {
                    clearTimeout(hoverTimeout);
                };
            }

            // 修改拖拽事件处理
            if (level === 0) {
                // 顶部书签栏的横向拖动
                item.draggable = true;
                
                item.addEventListener('dragstart', (e) => {
                    topBarDraggedItem = item;
                    topBarDraggedRect = item.getBoundingClientRect();
                    e.dataTransfer.effectAllowed = 'move';
                    item.classList.add('dragging');
                    
                    // 创建自定义拖动图像
                    const dragImage = item.cloneNode(true);
                    dragImage.style.opacity = '0.5';
                    document.body.appendChild(dragImage);
                    e.dataTransfer.setDragImage(dragImage, 0, 0);
                    setTimeout(() => document.body.removeChild(dragImage), 0);
                });

                item.addEventListener('dragend', () => {
                    item.classList.remove('dragging');
                    const indicators = document.querySelectorAll('.drag-indicator');
                    indicators.forEach(indicator => indicator.remove());
                    topBarDraggedItem = null;
                    topBarDraggedRect = null;
                });

                item.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    if (!topBarDraggedItem || topBarDraggedItem === item) return;

                    const rect = item.getBoundingClientRect();
                    const midX = rect.left + rect.width / 2;
                    
                    // 移除所有现有的指示器
                    const indicators = document.querySelectorAll('.drag-indicator');
                    indicators.forEach(indicator => indicator.remove());
                    
                    // 创建新的指示器
                    const indicator = document.createElement('div');
                    indicator.className = 'drag-indicator';
                    
                    if (e.clientX < midX) {
                        // 放在当前项的左边
                        indicator.style.left = `${rect.left - 2}px`;
                        item.dataset.dropPosition = 'before';
                    } else {
                        // 放在当前项的右边
                        indicator.style.left = `${rect.right - 2}px`;
                        item.dataset.dropPosition = 'after';
                    }
                    
                    indicator.style.top = `${rect.top}px`;
                    indicator.style.height = `${rect.height}px`;
                    document.body.appendChild(indicator);
                });

                item.addEventListener('dragleave', () => {
                    delete item.dataset.dropPosition;
                });

                item.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    if (!topBarDraggedItem || topBarDraggedItem === item) return;

                    const dropPosition = item.dataset.dropPosition;
                    if (!dropPosition) return;

                    try {
                        const newIndex = dropPosition === 'before' ? 
                            parseInt(item.dataset.index) :
                            parseInt(item.dataset.index) + 1;

                        await new Promise((resolve, reject) => {
                            chrome.bookmarks.move(topBarDraggedItem.dataset.id, 
                                { index: newIndex }, 
                                (result) => {
                                    if (chrome.runtime.lastError) {
                                        reject(chrome.runtime.lastError);
                                    } else {
                                        resolve(result);
                                    }
                                }
                            );
                        });

                        // 刷新书签视图
                        chrome.bookmarks.getTree(function(bookmarks) {
                            displayBookmarks(bookmarks);
                        });
                    } catch (error) {
                        console.error('移动书签失败:', error);
                        showToast('移动书签失败');
                    }

                    // 清理
                    const indicators = document.querySelectorAll('.drag-indicator');
                    indicators.forEach(indicator => indicator.remove());
                    delete item.dataset.dropPosition;
                });
            } else {
                // 保持其他层级的垂直拖动功能不变
                item.draggable = true;
                item.addEventListener('dragstart', handleDragStart);
                item.addEventListener('dragend', handleDragEnd);
                item.addEventListener('dragover', handleDragOver);
                item.addEventListener('drop', handleDrop);
                item.addEventListener('dragleave', handleDragLeave);
            }
        });
        
        // 将所有元素添加到文档片段中
        items.forEach(item => fragment.appendChild(item));
        
        // 将文档片段添加到列中
        column.appendChild(fragment);
        
        // 修改部分：添加动画效果
        column.classList.add('fade-in');  // 给列容器添加淡入动画类
        column.addEventListener('animationend', () => {
            column.classList.remove('fade-in');  // 动画结束后移除动画类
        }, { once: true }); // { once: true } 确保动画事件只触发一次
        // 修改部分：以上单独动画效果代码


        // 添加拖动条
        const addResizeHandle = (container) => {
            // 确保容器的定位属性为 relative
            container.style.position = 'relative';

            // 检查并移除已存在的拖动条
            const existingHandle = container.querySelector('.resize-handle');
            if (existingHandle) {
                existingHandle.remove();
            }

            // 创建新的拖动条
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            container.appendChild(resizeHandle);

            // 更新拖动条高度的函数
            const updateResizeHandleHeight = () => {
                // 使用 scrollHeight 获取容器的完整内容高度
                const containerHeight = container.scrollHeight;
                resizeHandle.style.height = `${containerHeight}px`;
            };

            // 初始化时更新高度
            updateResizeHandleHeight();

            // 监听容器内容变化
            const observer = new MutationObserver(updateResizeHandleHeight);
            observer.observe(container, {
                childList: true,
                subtree: true,
                attributes: true
            });

            // 监听容器滚动事件
            container.addEventListener('scroll', updateResizeHandleHeight);

            // 监听窗口大小变化
            window.addEventListener('resize', updateResizeHandleHeight);

            // 添加拖动事件
            resizeHandle.addEventListener('mousedown', (e) => {
                startResizing(e, container);
            });
        };

        // 为所有目标容器添加拖动条功能
        const initializeAllResizables = () => {
            document.querySelectorAll('.bookmark-column').forEach(container => {
                if (container.dataset.level === '0') {
                    return;
                }
                addResizeHandle(container);
            });
        };

        // 执行初始化
        initializeAllResizables();

        // 以上添加拖动条单独代码

        // 添加自动滚动逻辑
        const scrollToNewColumn = () => {
            const containerRect = parentElement.getBoundingClientRect();
            const columnRect = column.getBoundingClientRect();
            
            // 计算容器中心点
            const containerCenter = containerRect.left + (containerRect.width / 2);
            // 计算列的中心点
            const columnCenter = columnRect.left + (columnRect.width / 2);
            
            // 计算需要滚动的距离，使列居中显示
            const scrollDistance = columnCenter - containerCenter;
            
            // 计算目标滚动位置
            const targetScrollLeft = parentElement.scrollLeft + scrollDistance;
            
            // 使用平滑滚动
            parentElement.scrollTo({
                left: targetScrollLeft,
                behavior: 'smooth'
            });
        };

        // 使用 requestAnimationFrame 确保 DOM 更新后再滚动
        requestAnimationFrame(scrollToNewColumn);
    }


    // 处理上下文菜单的显示
    bookmarkContainer.addEventListener('contextmenu', function (event) {
        event.preventDefault();
        
        // 获取点击的元素
        const targetElement = event.target;
        const bookmarkItem = targetElement.closest('.bookmark-item');
        const bookmarkColumn = targetElement.closest('.bookmark-column');
        
        // 如果既不是书签项也不是书签列的空白区域，则不显示菜单
        if (!bookmarkItem && !bookmarkColumn) {
            return;
        }

        // 清除所有高亮
        document.querySelectorAll('.bookmark-item.highlgg, .module-content li.highlgg').forEach(item => {
            item.classList.remove('highlgg');
        });

        // 如果点击在书签项上，高亮该项
        if (bookmarkItem) {
            bookmarkItem.classList.add('highlgg');
        }
        
        // 显示右键菜单
        showContextMenu(event, bookmarkItem, bookmarkColumn);
    });

    // 修改文档点击事件处理程序
        document.addEventListener('click', function (event) {
        const menu = contextMenu;
        // 如果点击位置不在右键菜单上，则隐藏菜单
        if (!menu.contains(event.target)) {
            // 隐藏菜单前清除相关引用
            menu.relatedTarget = null;
            menu.relatedColumn = null;
            menu.style.display = 'none';
            // 移除标记
            delete document.body.dataset.contextMenuOpen;
        }
    });

    // 修改右键菜单处理函数
    function showContextMenu(e, bookmarkElement, column) {
        // 获取当前列的上一列高亮的文件夹ID
        const prevColumn = column.previousElementSibling;
        const parentFolderId = prevColumn 
            ? (prevColumn.querySelector('.bookmark-item.highlighted')?.dataset.id || '1')  // 如果找到高亮文件夹就用它的ID
            : '1';  // 如果是第一列，使用根目录ID '1'
        
        document.body.dataset.contextMenuOpen = 'true';
        
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.innerHTML = '';
        const ul = document.createElement('ul');
        
        if (bookmarkElement) {
            // 点击在书签项上
            const isFolder = !bookmarkElement.dataset.url;
            
            if (isFolder) {
                // 文件夹菜单项 - 移除新建文件夹选项
                ul.innerHTML = `
                    <li id="openAll">
                        <img src="/img/open_all.svg" class="menu-icon" alt="">
                        打开所有书签
                    </li>
                    <li id="rename">
                        <img src="/img/rename.svg" class="menu-icon" alt="">
                        重命名文件夹
                    </li>
                    <hr>
                    <li id="sortAscending">
                        <img src="/img/sort_asc.svg" class="menu-icon" alt="">
                        升序排序
                    </li>
                    <li id="sortDescending">
                        <img src="/img/sort_desc.svg" class="menu-icon" alt="">
                        降序排序
                    </li>
                    <li id="move">
                        <img src="/img/move.svg" class="menu-icon" alt="">
                        移动到...
                    </li>
                    <hr>
                    <li id="delete">
                        <img src="/img/delete.svg" class="menu-icon" alt="">
                        删除文件夹
                    </li>
                `;
            } else {
                // 书签菜单项 - 添加排序选项
                ul.innerHTML = `
                    <li id="open">
                        <img src="/img/open.svg" class="menu-icon" alt="">
                        在新标签打开
                    </li>
                    <li id="openNew">
                        <img src="/img/open_new.svg" class="menu-icon" alt="">
                        在新窗口中打开
                    </li>
                    <hr>
                    
                    <li id="editUrl">
                        <img src="/img/edit.svg" class="menu-icon" alt="">
                        修改网址
                    </li>
                    <li id="rename">
                        <img src="/img/rename.svg" class="menu-icon" alt="">
                        重命名书签
                    </li>
                    <li id="move">
                        <img src="/img/move.svg" class="menu-icon" alt="">
                        移动到...
                    </li>
                     <hr>
                    <li id="newFolder">
                        <img src="/img/folder.svg" class="menu-icon" alt="">
                        新建文件夹
                    </li>
                    <li id="copyUrl">
                        <img src="/img/copy.svg" class="menu-icon" alt="">
                        复制网址
                    </li>
                    <hr>
                     <li id="sortAscending">
                        <img src="/img/sort_asc.svg" class="menu-icon" alt="">
                        升序排序
                    </li>
                    <li id="sortDescending">
                        <img src="/img/sort_desc.svg" class="menu-icon" alt="">
                        降序排序
                    </li>

                    <hr>
                    <li id="delete">
                        <img src="/img/delete.svg" class="menu-icon" alt="">
                        删除书签
                    </li>
                `;
            }
        } else if (column) {
            // 点击在列的空白处 - 添加排序选项
            ul.innerHTML = `
                <li id="newFolder">
                    <img src="/img/folder.svg" class="menu-icon" alt="">
                    新建文件夹
                </li>
                <hr>
                <li id="sortAscending">
                    <img src="/img/sort_asc.svg" class="menu-icon" alt="">
                    升序排序
                </li>
                <li id="sortDescending">
                    <img src="/img/sort_desc.svg" class="menu-icon" alt="">
                    降序排序
                </li>
            `;
        }

        contextMenu.appendChild(ul);
        contextMenu.dataset.parentId = parentFolderId;

        // 先显示菜单但设为不可见
        contextMenu.style.visibility = 'hidden';
        contextMenu.style.display = 'block';

        // 获取菜单和视窗的尺寸
        const menuRect = contextMenu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 计算最佳位置
        const x = Math.min(
            Math.max(10, e.clientX),
            viewportWidth - menuRect.width - 10
        );
        
        const y = Math.min(
            Math.max(10, e.clientY),
            viewportHeight - menuRect.height - 10
        );

        // 应用位置并显示菜单
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.style.visibility = 'visible';

        // 保存相关元素引用
        contextMenu.relatedTarget = bookmarkElement;
        contextMenu.relatedColumn = column;

        // 修改右键菜单项点击事件处理
        contextMenu.querySelectorAll('li').forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                handleContextMenuAction(item.id, contextMenu.relatedTarget);
                contextMenu.style.display = 'none';
                contextMenu.relatedTarget = null;
            };
        });
    }

    // 修改刷新书签的函数
    function refreshBookmarks() {
        try {
            // 保存当前视图状态
            const openFolders = [];
            const scrollPositions = new Map();
            
            document.querySelectorAll('.bookmark-column').forEach((column, index) => {
                const highlightedItem = column.querySelector('.bookmark-item.highlighted');
                // 只保存有效的滚动位置
                if (column.scrollTop > 0) {
                    scrollPositions.set(index, column.scrollTop);
                }
                
                if (highlightedItem) {
                    openFolders.push({
                        id: highlightedItem.dataset.id,
                        level: parseInt(column.dataset.level)
                    });
                }
            });

            chrome.bookmarks.getTree((bookmarks) => {
                const bookmarksBar = bookmarks[0].children[0];
                if (bookmarksBar) {
                    bookmarkContainer.innerHTML = '';
                    renderBookmarks(bookmarksBar.children, bookmarkContainer, 0);
                    
                    // 使用 Promise 处理异步恢复
                    const restorePromises = openFolders.map(folder => {
                        return new Promise(resolve => {
                            const folderItem = bookmarkContainer.querySelector(`[data-id="${folder.id}"]`);
                            if (folderItem) {
                                folderItem.click();
                                resolve();
                            } else {
                                resolve();
                            }
                        });
                    });

                    Promise.all(restorePromises).then(() => {
                        // 使用 RAF 队列确保滚动位置正确恢复
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                document.querySelectorAll('.bookmark-column').forEach((column, index) => {
                                    const savedScrollTop = scrollPositions.get(index);
                                    if (typeof savedScrollTop === 'number' && savedScrollTop > 0) {
                                        column.scrollTop = savedScrollTop;
                                    }
                                });
                            });
                        });
                    });
                }
            });
        } catch (error) {
            console.error('刷新书签时出错:', error);
            showToast('刷新书签时出错，请重试');
        }
    }

    // 修改 handleContextMenuAction 中的相关操作
    function handleContextMenuAction(action, element, isColumn) {
        const bookmarkId = element?.dataset.id;
        
        switch (action) {
            case 'openAll':
                if (isFolder) {
            chrome.bookmarks.getChildren(bookmarkId, (children) => {
                        children.forEach(child => {
                            if (child.url) {
                                chrome.tabs.create({ url: child.url });  // 使用 chrome.tabs.create
                            }
                        });
                    });
                }
                break;
                
            case 'open':
                chrome.tabs.create({ 
                    url: element.dataset.url,
                    active: true  // 立即切换到新标签页
                });
                break;
                
            case 'openNew':
                chrome.windows.create({  // 使用 chrome.windows.create
                    url: element.dataset.url
                });
                break;
                
            case 'move':
                showMoveDialog(element, () => {
                    refreshBookmarks();
                    // 移动完成后重新高亮新位置的元素
                    setTimeout(() => {
                        const movedElement = document.querySelector(`[data-id="${element.dataset.id}"]`);
                        if (movedElement) {
                            setHighlight(movedElement);
                        }
                    }, 100);
                });
                break;
                
            case 'rename':
                showEditDialog(
                    '重命名',
                    element.querySelector('.bookmark-title').textContent,
                    null,
                    (newName) => {
                        chrome.bookmarks.update(element.dataset.id, { title: newName }, () => {
                            refreshBookmarks();
                            // 重命名完成后重新高亮元素
                            setTimeout(() => {
                                const renamedElement = document.querySelector(`[data-id="${element.dataset.id}"]`);
                                if (renamedElement) {
                                    setHighlight(renamedElement);
                                }
                            }, 100);
                        });
                    }
                );
                break;
                
            case 'delete':
                const isFolder = !element.dataset.url;
                const itemName = element.querySelector('.bookmark-title').textContent;
                showConfirmDialog(
                    isFolder 
                        ? '删除文件夹 (此操作将删除文件夹及其所有内容)' 
                        : '删除书签',
                    itemName,
                    () => {
                        chrome.bookmarks.removeTree(element.dataset.id, () => {
                        if (chrome.runtime.lastError) {
                                showToast('删除失败：' + chrome.runtime.lastError.message);
                            } else {
                                showToast(isFolder ? '文件夹已删除' : '书签已删除');
                                refreshBookmarks();
                                element.classList.remove('highlgg');
                        }
                    });
                }
                );
                break;
                
            case 'newFolder':
                try {
                    const currentColumn = contextMenu.relatedColumn;
                    let parentId;
                    
                    if (!currentColumn) {
                        showToast('无法确定文件夹位置');
                        return;
                    }
                    
                    const level = parseInt(currentColumn.dataset.level);
                    
                    // 简化父文件夹ID的获取逻辑
                    if (level === 0) {
                        parentId = '1';
                    } else {
                        // 直接获取上一列高亮的文件夹ID，这是最准确的方式
                        const prevColumn = currentColumn.previousElementSibling;
                        const highlightedFolder = prevColumn?.querySelector('.bookmark-item.highlighted');
                        parentId = highlightedFolder?.dataset.id;
                    }
                    
                    if (!parentId) {
                        showToast('无法确定父文件夹位置');
                        return;
                    }

                    showEditDialog(
                        '新建文件夹',
                        '',
                        null,
                        (newName) => {
                            const trimmedName = newName.trim();
                            if (!trimmedName) {
                                showToast('文件夹名称不能为空');
                                return;
                            }
                            
                            chrome.bookmarks.create({
                                parentId: parentId,
                                title: trimmedName,
                            }, (newBookmark) => {
                                if (chrome.runtime.lastError) {
                                    showToast('创建文件夹失败：' + chrome.runtime.lastError.message);
                                } else {
                                    showToast('文件夹已创建');
                                    refreshBookmarks();
                                    // 创建完成后找到并高亮新文件夹
                                    setTimeout(() => {
                                        const newFolder = document.querySelector(`[data-id="${newBookmark.id}"]`);
                                        if (newFolder) {
                                            setHighlight(newFolder);
                                        }
                                    }, 100);
                                }
                            });
                        }
                    );
                } catch (error) {
                    console.error('新建文件夹失败:', error);
                    showToast('创建文件夹时出错，请重试');
                }
                break;
                
            case 'sortAscending':
                sortBookmarks(element, true);
                break;
                
            case 'sortDescending':
                sortBookmarks(element, false);
                break;
                
            case 'copyUrl':
                const url = element.dataset.url;
                navigator.clipboard.writeText(url).then(() => {
                    showToast('网址已复制到剪贴板', 1500);  // 1.5秒
                }).catch(err => {
                    console.error('复制失败:', err);
                    showToast('复制失败，请重试', 3000);  // 错误提示显示更长时间
                });
                break;
                
            case 'editUrl':
                showEditDialog(
                    '修改网址',
                    element.dataset.url,
                    isValidUrl,
                    (newUrl) => {
                        chrome.bookmarks.update(element.dataset.id, { url: newUrl }, () => {
                            refreshBookmarks();
                            // 修改网址完成后重新高亮元素
                            setTimeout(() => {
                                const editedElement = document.querySelector(`[data-id="${element.dataset.id}"]`);
                                if (editedElement) {
                                    setHighlight(editedElement);
                                }
                            }, 100);
                        });
                    }
                );
                break;
        }
    }

    function showToast(message, duration = 2000) {  // 默认 2000ms，可自定义
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast show';
    
        // 使用 requestAnimationFrame 来避免延迟触发
        setTimeout(() => {
            toast.className = 'toast';
        }, duration);
    }
    
    // 修改移动对话框相关函数
    function showMoveDialog(bookmarkElement, onMoveSuccess = null) {
        // 防止XSS攻击，使用安全的文本内容设置
        const isFolder = !bookmarkElement.dataset.url;
        const itemName = sanitizeText(bookmarkElement.querySelector('.bookmark-title').textContent);
        const iconUrl = isFolder ? '/img/folder_icon.svg' : getIconUrl(bookmarkElement.dataset.url);
        const dialogTitle = document.querySelector('.move-dialog-header h3');
        dialogTitle.innerHTML = `移动${isFolder ? '文件夹' : '书签'}到...<span class="item-name"><img src="${iconUrl}" class="dialog-item-icon" alt="">${itemName}</span>`;

        const moveDialog = document.getElementById('moveDialog');
        const bookmarkTree = document.getElementById('bookmarkTree');
        const cancelButton = document.getElementById('cancelMove');
        const confirmButton = document.getElementById('confirmMove');
        
        let selectedFolder = null;
        let isProcessing = false; // 添加处理状态标记

        // 优化清理函数
        const cleanup = () => {
            moveDialog.style.display = 'none';
            bookmarkTree.innerHTML = '';
            selectedFolder = null;
            isProcessing = false;
            // 移除所有事件监听器
            document.removeEventListener('keydown', handleKeyDown);
        };

        // 添加移动验证函数
        async function isValidMove(sourceId, targetId) {
            // 验证源文件夹和目标文件夹是否相同
            if (sourceId === targetId) {
                return false;
            }

            try {
                // 检查目标文件夹是否是源文件夹的子文件夹（防止循环移动）
                const checkParents = async (currentId) => {
                    if (currentId === '0' || currentId === '1') return false;
                    if (currentId === sourceId) return true;
                    
                    const [parent] = await new Promise(resolve => {
                        chrome.bookmarks.get(currentId, (items) => resolve(items));
                    });
                    
                    if (!parent || !parent.parentId) return false;
                    return checkParents(parent.parentId);
                };

                // 验证目标文件夹
                const isChildFolder = await checkParents(targetId);
                if (isChildFolder) {
                    showToast('不能将文件夹移动到其子文件夹中');
                    return false;
                }

                // 验证文件夹是否存在
                const [source, target] = await new Promise(resolve => {
                    chrome.bookmarks.get([sourceId, targetId], (items) => resolve(items));
                });

                return !!(source && target);
            } catch (error) {
                console.error('移动验证失败:', error);
                return false;
            }
        }

        // 修改渲染书签树的函数
        function renderBookmarkTree(node, container, level = 0) {
            if (!node.children) return;

            // 使用文档片段优化性能
            const fragment = document.createDocumentFragment();
            const folders = node.children.filter(child => !child.url);
            
            // 添加防抖处理展开/折叠事件
            const debouncedToggle = debounce((show, subFolder, expandIcon, folder, level) => {
                toggleSubFolder(show, subFolder, expandIcon, folder, level);
            }, 100);

            folders.forEach((folder, index) => {
                const item = document.createElement('div');
                item.className = 'bookmark-tree-item';
                item.dataset.id = folder.id;
                
                const subFolder = document.createElement('div');
                subFolder.className = 'sub-folder';
                
                if (!(level === 0 && index < 4)) {
                    subFolder.style.display = 'none';
                    subFolder.style.height = '0';
                }
                
                const contentContainer = document.createElement('div');
                contentContainer.className = 'folder-content';
                contentContainer.style.paddingLeft = `${level * 28}px`;

                // 优化子文件夹检查
                chrome.bookmarks.getChildren(folder.id, (children) => {
                    const hasSubFolders = children && children.some(child => !child.url);
                    
                    if (hasSubFolders) {
                        const expandIcon = document.createElement('span');
                        expandIcon.className = 'expand-icon';
                        const shouldExpand = level === 0 && index < 4;
                        expandIcon.textContent = shouldExpand ? '▼' : '▶';
                        contentContainer.insertBefore(expandIcon, contentContainer.firstChild);

                        // 使用 WeakMap 存储展开状态
                        const expandState = new WeakMap();
                        expandState.set(item, shouldExpand);

                        // 优化展开/折叠处理函数
                        expandIcon.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const isExpanded = expandState.get(item);
                            debouncedToggle(!isExpanded, subFolder, expandIcon, folder, level);
                            expandState.set(item, !isExpanded);
                        };

                        if (shouldExpand) {
                            loadSubFolders(folder, subFolder, level);
                        }
                    }
                });

                // 优化图标加载
                const icon = new Image();
                icon.src = '/img/folder_icon.svg';
                icon.className = 'folder-icon';
                icon.draggable = false;
                contentContainer.appendChild(icon);

                const title = document.createElement('span');
                title.textContent = sanitizeText(folder.title || 'No Title');
                title.className = 'folder-title';
                contentContainer.appendChild(title);

                item.appendChild(contentContainer);
                item.appendChild(subFolder);
                fragment.appendChild(item);

                // 优化选择处理
                contentContainer.onclick = (e) => {
                    if (isProcessing) return; // 如果正在处理中，忽略点击
                    
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (item.classList.contains('selected')) return;
                    
                    document.querySelectorAll('.bookmark-tree-item.selected')
                        .forEach(el => el.classList.remove('selected'));
                    
                    item.classList.add('selected');
                    selectedFolder = folder.id;
                };
            });

            container.appendChild(fragment);
        }

        // 优化子文件夹加载
        async function loadSubFolders(folder, subFolder, level) {
            try {
                const children = await new Promise(resolve => {
                    chrome.bookmarks.getChildren(folder.id, resolve);
                });
                
                if (children && children.length > 0) {
                    renderBookmarkTree({ children }, subFolder, level + 1);
                    requestAnimationFrame(() => {
                        subFolder.style.display = 'block';
                        subFolder.style.height = 'auto';
                    });
                }
            } catch (error) {
                console.error('加载子文件夹失败:', error);
            }
        }

        // 优化展开/折叠处理
        function toggleSubFolder(show, subFolder, expandIcon, folder, level) {
            if (!subFolder) return;

            expandIcon.textContent = show ? '▼' : '▶';
            
            if (show) {
                subFolder.style.display = 'block';
                subFolder.style.height = '0';
                
                if (!subFolder.children.length) {
                    loadSubFolders(folder, subFolder, level);
                }
                
                requestAnimationFrame(() => {
                    subFolder.style.height = subFolder.scrollHeight + 'px';
                });
            } else {
                const currentHeight = subFolder.scrollHeight;
                subFolder.style.height = currentHeight + 'px';
                requestAnimationFrame(() => {
                    subFolder.style.height = '0';
                });
            }
        }

        // 处理确认按钮点击
        confirmButton.onclick = async (e) => {
            if (isProcessing) return; // 防止重复提交
            
            if (!selectedFolder) {
                showToast('请选择目标文件夹');
                return;
            }

            try {
                isProcessing = true;
                confirmButton.disabled = true;
                
                const sourceId = bookmarkElement.dataset.id;
                const isValid = await isValidMove(sourceId, selectedFolder);
                
                if (!isValid) {
                    showToast('无法移动到所选位置');
                    return;
                }

                await new Promise((resolve, reject) => {
                    chrome.bookmarks.move(
                        sourceId,
                        { parentId: selectedFolder },
                        (result) => {
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError);
                            } else {
                                resolve(result);
                            }
                        }
                    );
                });

                showToast('移动成功');
                if (onMoveSuccess) {
                    onMoveSuccess();
                }
                cleanup();
            } catch (error) {
                console.error('移动失败:', error);
                showToast(error.message || '移动失败');
            } finally {
                isProcessing = false;
                confirmButton.disabled = false;
            }
        };

        // 优化键盘事件处理
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                cleanup();
            } else if (e.key === 'Enter' && !isProcessing) {
                confirmButton.click();
            }
        };

        // 添加事件监听器
        document.addEventListener('keydown', handleKeyDown);
        cancelButton.onclick = cleanup;
        moveDialog.onclick = (e) => {
            if (e.target === moveDialog) cleanup();
        };

        // 显示对话框并加载书签树
        chrome.bookmarks.getTree(function(tree) {
            bookmarkTree.innerHTML = '';
            renderBookmarkTree(tree[0].children[0], bookmarkTree, 0);
            moveDialog.style.display = 'flex';
        });
    }

    // 保存当前视图状态
    function saveCurrentViewState() {
        const state = {
            openFolders: [],
            scrollPositions: {}
        };

        document.querySelectorAll('.bookmark-column').forEach(column => {
            if (column.dataset.level) {
                state.openFolders.push(column.dataset.level);
                state.scrollPositions[column.dataset.level] = column.scrollTop;
            }
        });

        return state;
    }

    // 恢复视图状态
    function restoreViewState(state) {
        state.openFolders.forEach(level => {
            const column = document.querySelector(`.bookmark-column[data-level="${level}"]`);
            if (column) {
                column.scrollTop = state.scrollPositions[level] || 0;
            }
        });
    }

    // 点击页面空白处关闭上下文菜单
    document.addEventListener('click', function (event) {
        if (!contextMenu.contains(event.target)) {
            const relatedBookmark = contextMenu.relatedTarget;
            if (relatedBookmark) {
                // 获取关联书签所在的列容器和层级
                const currentColumn = relatedBookmark.closest('.bookmark-column');
                const currentLevel = currentColumn.dataset.level;
                
                // 只清除当前层级的高亮样式
                document.querySelectorAll(`.bookmark-column[data-level="${currentLevel}"] .bookmark-item.highlgg`)
                    .forEach(item => item.classList.remove('highlgg'));
            }
            contextMenu.style.display = 'none';
        }
    });

    // 修改拖动处理函数
    const handleResize = debounce((clientX, container) => {
        requestAnimationFrame(() => {
            const rect = container.getBoundingClientRect();
            const newWidth = Math.max(Math.min(clientX - rect.left, window.innerWidth - rect.left), 100);
            container.style.width = `${newWidth}px`;
        });
    }, 16);

    // 为所有目标容器添加拖动条功能
    const initializeAllResizables = () => {
        document.querySelectorAll('.bookmark-column').forEach(container => {
            if (container.dataset.level === '0') {
                return;
            }
            addResizeHandle(container);
        });
    };

    // 添加全局错误处理
    window.addEventListener('error', function(event) {
        console.error('Global error:', event.error);
        showToast('操作出现错误，请刷新页面重试');
    });

    // 使用 IntersectionObserver 优化渲染
    const observeVisibility = (element) => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 元素进入视口时加载图标
                    const icon = entry.target.querySelector('img');
                    if (icon && icon.dataset.src) {
                        icon.src = icon.dataset.src;
                        delete icon.dataset.src;
                    }
                }
            });
        });
        observer.observe(element);
    };

    // 添加 XSS 防护
    function sanitizeText(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 排序书签的函数
    function sortBookmarks(bookmarkElement, ascending) {
        try {
            const column = bookmarkElement.closest('.bookmark-column');
            if (!column) return;

            const items = Array.from(column.querySelectorAll('.bookmark-item'));
            if (!items.length) return;

            const sortedItems = items.sort((a, b) => {
                const idA = parseInt(a.dataset.id, 10) || 0;
                const idB = parseInt(b.dataset.id, 10) || 0;
                return ascending ? idA - idB : idB - idA;
            });

            // 使用文档片段优化性能
            const fragment = document.createDocumentFragment();
            sortedItems.forEach(item => fragment.appendChild(item));
            column.appendChild(fragment);
        } catch (error) {
            console.error('排序出错:', error);
            showToast('排序操作失败');
        }
    }

    // 添加 Memo 缓存函数
    function useMemo(factory, dependencies) {
        const key = JSON.stringify(dependencies);
        useMemo.cache = useMemo.cache || new Map();
        
        if (!useMemo.cache.has(key)) {
            useMemo.cache.set(key, factory());
        }
        
        // 缓存清理（保持缓存大小在合理范围）
        if (useMemo.cache.size > 100) {
            const firstKey = useMemo.cache.keys().next().value;
            useMemo.cache.delete(firstKey);
        }
        
        return useMemo.cache.get(key);
    }

    // 添加模块容器的右键菜单处理
    document.querySelectorAll('.module-content').forEach(moduleContent => {
        moduleContent.addEventListener('contextmenu', function(event) {
            // 如果点击的不是列表项，则阻止右键菜单
            if (!event.target.closest('li')) {
                event.preventDefault();
                // 清除所有高亮
                document.querySelectorAll('.bookmark-item.highlgg, .module-content li.highlgg').forEach(item => {
                    item.classList.remove('highlgg');
                });
                // 隐藏右键菜单
                contextMenu.style.display = 'none';
            }
        });
    });

    // 添加 URL 验证函数
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // 修改通用的编辑对话框函数
    function showEditDialog(title, value, validator, onConfirm) {
        const dialog = document.getElementById('editDialog');
        const titleElement = document.getElementById('editDialogTitle');
        const input = document.getElementById('editDialogInput');
        const error = document.getElementById('editDialogError');
        const cancelButton = document.getElementById('cancelEdit');
        const confirmButton = document.getElementById('confirmEdit');

        // 保持简单直接的标题设置
        titleElement.textContent = title;
        
        input.value = value;
        error.textContent = '';

        const cleanup = () => {
            dialog.style.display = 'none';
            input.value = '';
            error.textContent = '';
        };

        // 修改点击外部关闭的处理
        let isSelecting = false;  // 添加文本选择状态标记
        
        // 监听文本选择开始
        input.addEventListener('mousedown', () => {
            isSelecting = true;
        });
        
        // 监听文本选择结束
        document.addEventListener('mouseup', () => {
            setTimeout(() => {
                isSelecting = false;
            }, 0);
        }, { once: true });

        // 点击外部关闭
        dialog.onclick = (e) => {
            if (e.target === dialog && !isSelecting) {
                cleanup();
            }
        };

        // 确认按钮处理
        confirmButton.onclick = async () => {
            const newValue = input.value.trim();
            if (!newValue) {
                error.textContent = '请输入内容';
                return;
            }

            if (validator && !await validator(newValue)) {
                error.textContent = '输入内容无效';
                return;
            }

            cleanup();
            onConfirm(newValue);
        };

        // 取消按钮处理
        cancelButton.onclick = cleanup;

        // ESC 键关闭
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                cleanup();
                document.removeEventListener('keydown', handleKeyDown);
            } else if (e.key === 'Enter') {
                confirmButton.click();
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        // 显示对话框并聚焦输入框
        dialog.style.display = 'flex';
        input.focus();
        input.select();
    }

    // 修改移动书签的处理函数
    function handleMoveBookmark(element) {
        // 判断是否为文件夹
        const isFolder = !element.dataset.url;
        const title = isFolder ? '移动文件夹' : '移动书签';

        // 保存当前视图状态
        const currentState = saveCurrentViewState();

        // 创建一个临时的书签对象，用于移动对话框
        const tempBookmark = {
            id: element.dataset.id,
            title: isFolder ? element.textContent.trim() : element.querySelector('a').textContent,
            parentId: element.closest('.bookmark-column').dataset.parentid,
            dataset: {
                id: element.dataset.id
            },
            closest: (selector) => {
                return element.closest(selector);
            },
            querySelector: () => ({
                textContent: isFolder ? element.textContent.trim() : element.querySelector('a').textContent
            }),
            classList: {
                add: () => {},
                remove: () => {}
            }
        };

        // 使用现有的移动对话框，并添加移动成功后的回调
        showMoveDialog(tempBookmark, () => {
            // 移动成功后刷新并恢复状态
            chrome.bookmarks.getTree(function (bookmarks) {
                displayBookmarks(bookmarks);
                // 如果是文件夹，需要展开目标文件夹
                if (isFolder) {
                    const targetFolderId = tempBookmark.newParentId; // 这个ID在移动时设置
                    if (targetFolderId) {
                        currentState.openFolders.push(targetFolderId);
                    }
                }
                // 恢复视图状态
                restoreViewState(currentState);
            });
            // 显示成功提示
            showToast(isFolder ? '文件夹已移动' : '书签已移动');
        });
    }

    // 添加通用的确认对话框函数
    function showConfirmDialog(title, message, onConfirm) {
        const dialog = document.getElementById('confirmDialog');
        const titleElement = document.getElementById('confirmDialogTitle');
        const messageElement = document.getElementById('confirmDialogMessage');
        const cancelButton = document.getElementById('cancelConfirm');
        const confirmButton = document.getElementById('confirmConfirm');

        // 设置对话框类型标记
        dialog.dataset.action = title.includes('删除') ? 'delete' : '';

        titleElement.textContent = title;
        // 如果是删除操作，添加图标
        if (title.includes('删除')) {
            const isFolder = title.includes('文件夹');
            const iconUrl = isFolder ? '/img/folder_icon.svg' : getIconUrl(document.querySelector('.bookmark-item.highlgg')?.dataset.url);
            messageElement.innerHTML = `<img src="${iconUrl}" class="dialog-item-icon" alt="">${message}`;
        } else {
            messageElement.textContent = message;
        }
        messageElement.className = 'confirm-message' + (message.includes('删除') ? ' delete-confirm' : '');

        const cleanup = () => {
            dialog.style.display = 'none';
            messageElement.className = 'confirm-message';
            delete dialog.dataset.action;  // 清理标记
        };

        // 确认按钮处理
        confirmButton.onclick = () => {
            cleanup();
            onConfirm();
        };

        // 取消按钮处理
        cancelButton.onclick = cleanup;

        // ESC 键关闭
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                cleanup();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        // 点击外部关闭
        dialog.onclick = (e) => {
            if (e.target === dialog) cleanup();
        };

        // 显示对话框
        dialog.style.display = 'flex';
    }

    // 拖拽相关变量
    let draggedItem = null;
    let draggedItemColumn = null;
    
    // 处理开始拖动
    function handleDragStart(e) {
        draggedItem = e.target;
        draggedItemColumn = draggedItem.closest('.bookmark-column');
        e.target.classList.add('dragging');
        
        // 存储拖动项的信息
        e.dataTransfer.setData('text/plain', JSON.stringify({
            id: draggedItem.dataset.id,
            index: draggedItem.dataset.index,
            isFolder: !draggedItem.dataset.url
        }));
    }
    
    // 处理拖动结束
    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach(item => {
            item.classList.remove('drag-over');
        });
        draggedItem = null;
        draggedItemColumn = null;
    }
    
    // 处理拖动经过
    function handleDragOver(e) {
        e.preventDefault();
        if (!draggedItem) return;
        
        const targetColumn = e.target.closest('.bookmark-column');
        if (targetColumn !== draggedItemColumn) return;
        
        const targetItem = e.target.closest('.bookmark-item');
        if (!targetItem || targetItem === draggedItem) return;
        
        const rect = targetItem.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const isAbove = e.clientY < midY;
        
        targetItem.classList.add('drag-over');
        targetItem.style.borderTop = isAbove ? '2px solid #61afef' : 'none';
        targetItem.style.borderBottom = !isAbove ? '2px solid #61afef' : 'none';
    }
    
    // 处理放置
    function handleDrop(e) {
        e.preventDefault();
        if (!draggedItem) return;
        
        const targetItem = e.target.closest('.bookmark-item');
        if (!targetItem || targetItem === draggedItem) return;
        
        const targetColumn = targetItem.closest('.bookmark-column');
        if (targetColumn !== draggedItemColumn) return;
        
        const rect = targetItem.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const isAbove = e.clientY < midY;
        
        const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
        const targetIndex = parseInt(targetItem.dataset.index);
        const newIndex = isAbove ? targetIndex : targetIndex + 1;
        
        // 使用 Chrome Bookmarks API 移动书签
        chrome.bookmarks.move(dragData.id, { index: newIndex }, () => {
            if (chrome.runtime.lastError) {
                showToast('移动失败：' + chrome.runtime.lastError.message);
            } else {
                refreshBookmarks();
            }
        });
        
        targetItem.classList.remove('drag-over');
        targetItem.style.borderTop = '';
        targetItem.style.borderBottom = '';
    }
    
    // 处理离开拖动区域
    function handleDragLeave(e) {
        const targetItem = e.target.closest('.bookmark-item');
        if (targetItem) {
            targetItem.classList.remove('drag-over');
            targetItem.style.borderTop = '';
            targetItem.style.borderBottom = '';
        }
    }

    // 使用 WeakMap 来跟踪高亮状态
    const highlightState = new WeakMap();

    function setHighlight(element) {
        try {
            if (!(element instanceof HTMLElement)) return;
            
            // 检查是否已经高亮
            if (highlightState.get(element)) return;
            
            clearAllHighlights();
            element.classList.add('highlgg');
            highlightState.set(element, true);
            
        } catch (error) {
            console.error('设置高亮失败:', error);
        }
    }

    function clearAllHighlights() {
        try {
            document.querySelectorAll('.bookmark-item.highlgg, .module-content li.highlgg')
                .forEach(el => {
                    el.classList.remove('highlgg');
                    highlightState.delete(el);
                });
        } catch (error) {
            console.error('清除高亮失败:', error);
        }
    }

    // 添加防抖处理，避免频繁切换高亮状态
    const setHighlightWithDebounce = debounce((element) => {
        setHighlight(element);
    }, 50);

    // 添加清理函数
    function cleanupHighlightEvents() {
        // 移除所有相关的事件监听器
        if (setHighlightWithDebounce.cancel) {
            setHighlightWithDebounce.cancel();
        }
    }

    // 在页面卸载时清理
    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            cleanupHighlightEvents();
        }
    });

    // 拖动条相关函数移到这里
    function startResizing(e) {
        // 如果是右键点击或已经在拖动，不处理
        if (e.button === 2 || isResizing) return;
        
        // 保存初始状态
        const column = e.target.parentElement;
        if (!column || !column.classList.contains('bookmark-column')) return;
        
        isResizing = true;
        currentResizer = e.target;
        startX = e.pageX;
        startWidth = Math.max(200, column.offsetWidth);
        
        // 添加正在拖动的状态类
        column.classList.add('resizing');
        
        // 添加遮罩和防止文本选择
        const overlay = document.createElement('div');
        overlay.className = 'resize-overlay';
        document.body.appendChild(overlay);
        document.body.classList.add('no-select');
        
        // 添加事件监听器
        document.addEventListener('mousemove', handleResizingWithDebounce);
        document.addEventListener('mouseup', stopResizing);
        document.addEventListener('keydown', handleResizingKeydown);
        
        // 清除可能的选中状态
        window.getSelection().removeAllRanges();
        
        e.preventDefault();
        e.stopPropagation();
    }
    
    function handleResizingKeydown(e) {
        if (e.key === 'Escape' && isResizing) {
            // 恢复到开始拖动时的宽度
            const column = currentResizer.parentElement;
            column.style.width = `${startWidth}px`;
            stopResizing();
        }
    }
    
    function handleResizingWithDebounce(e) {
        if (!isResizing) return;
        
        const column = currentResizer.parentElement;
        const container = document.querySelector('.bookmark-container');
        const maxWidth = container.offsetWidth * 0.8;
        
        const newWidth = startWidth + (e.pageX - startX);
        const limitedWidth = Math.min(maxWidth, Math.max(200, newWidth));
        
        requestAnimationFrame(() => {
            column.style.width = `${limitedWidth}px`;
        });
    }
    
    function stopResizing() {
        if (!isResizing) return;
        
        // 清理防抖函数
        if (handleResizingWithDebounce.cancel) {
            handleResizingWithDebounce.cancel();
        }
        
        isResizing = false;
        
        // 移除正在拖动的状态类
        if (currentResizer?.parentElement) {
            currentResizer.parentElement.classList.remove('resizing');
        }
        
        currentResizer = null;
        
        // 移除遮罩和清理状态
        const overlay = document.querySelector('.resize-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        document.body.classList.remove('no-select');
        
        // 移除事件监听器
        document.removeEventListener('mousemove', handleResizingWithDebounce);
        document.removeEventListener('mouseup', stopResizing);
        document.removeEventListener('keydown', handleResizingKeydown);
    }

    // 修改全局键盘事件监听
    const handleKeydown = debounce((e) => {
        if (e.code === 'Space' && !e.ctrlKey && !e.shiftKey && !e.altKey && 
            hoveredBookmark && hoveredBookmark.dataset.url) {
            e.preventDefault();
            
            if (previewWindow) {
                updatePreviewWindow(hoveredBookmark);
            } else {
                createPreviewWindow(hoveredBookmark);
            }
        }
    }, 100);  // 添加适当的防抖延迟

    document.addEventListener('keydown', handleKeydown);

    // 添加更新预览窗口的函数
    function updatePreviewWindow(bookmark) {
        try {
            if (previewWindow) {
                // 设置高亮
                setHighlight(bookmark);
                
                // 使用 Promise.all 并行处理更新
                Promise.all([
                    new Promise(resolve => {
                        chrome.windows.update(previewWindow.id, {
                            focused: true
                        }, resolve);
                    }),
                    new Promise(resolve => {
                        chrome.tabs.update(previewWindow.tabs[0].id, {
                            url: bookmark.dataset.url
                        }, resolve);
                    })
                ]).catch(error => {
                    console.error('更新预览窗口失败:', error);
                    previewWindow = null;
                });
            }
        } catch (error) {
            console.error('更新预览窗口失败:', error);
            previewWindow = null;
        }
    }

    // 修改预览窗口相关函数
    function createPreviewWindow(bookmark) {
        try {
            // 设置高亮
            setHighlight(bookmark);
            
            // 获取当前窗口的信息
            chrome.windows.getCurrent({}, (currentWindow) => {
                // 计算并验证窗口尺寸
                const width = Math.max(
                    WINDOW_SETTINGS.minWidth,
                    Math.round(currentWindow.width * WINDOW_SETTINGS.widthRatio)
                );
                const height = Math.max(
                    WINDOW_SETTINGS.minHeight,
                    Math.round(currentWindow.height * WINDOW_SETTINGS.heightRatio)
                );
                
                // 确保窗口位置在屏幕内
                const left = Math.round(currentWindow.left + (currentWindow.width - width) / 2);
                const top = Math.round(currentWindow.top + (currentWindow.height - height) / 2);
                
                // 创建新窗口
                chrome.windows.create({
                    url: bookmark.dataset.url,
                    type: 'popup',
                    width: width,
                    height: height,
                    left: left,
                    top: top,
                    focused: true
                }, (window) => {
                    if (chrome.runtime.lastError) {
                        console.error('创建窗口失败:', chrome.runtime.lastError);
                        return;
                    }
                    
                    previewWindow = window;
                    
                    // 使用 WeakMap 存储事件监听器引用
                    const listener = function onRemoved(windowId) {
                        if (windowId === window.id) {
                            previewWindow = null;
                            chrome.windows.onRemoved.removeListener(listener);
                        }
                    };
                    
                    chrome.windows.onRemoved.addListener(listener);
                });
            });
        } catch (error) {
            console.error('创建预览窗口失败:', error);
            previewWindow = null;
        }
    }

    // 添加对话框关闭事件处理
    function closeDialog(dialogId) {
        const dialog = document.getElementById(dialogId);
        if (dialog) {
            dialog.style.display = 'none';
            // 不清除高亮状态
        }
    }

    // 添加对话框取消按钮事件处理
    function handleDialogCancel(dialogId) {
        closeDialog(dialogId);
        // 不清除高亮状态
    }

});

