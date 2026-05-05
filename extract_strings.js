const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const files = fs.readFileSync('extract_ja.js').toString() ? [
"actions/categorize.ts",
"app/components/Nav.tsx",
"app/explore/components/CategoryFilter.tsx",
"app/explore/components/ExploreContent.tsx",
"app/explore/components/ExploreTabBar.tsx",
"app/explore/components/InfiniteScrollTrigger.tsx",
"app/explore/components/ItemList.tsx",
"app/explore/components/SearchBar.tsx",
"app/explore/components/UserList.tsx",
"app/explore/page.tsx",
"app/item/[id]/page.tsx",
"app/login/page.tsx",
"app/messages/[id]/page.tsx",
"app/messages/components/RoomListItem.tsx",
"app/messages/layout.tsx",
"app/messages/page.tsx",
"app/page.tsx",
"app/profile/[id]/page.tsx",
"app/profile/settings/page.tsx",
"components/AddItemModal.tsx",
"components/BlockListModal.tsx",
"components/CommentItem.tsx",
"components/CompleteItemModal.tsx",
"components/EditItemModal.tsx",
"components/FollowListModal.tsx",
"components/FollowRequestsModal.tsx",
"components/ItemCard.tsx",
"components/NotificationDropdown.tsx",
"components/UserOptionsModal.tsx",
"hooks/useAuthForm.ts",
"hooks/useBlock.ts",
"hooks/useExplore.ts",
"hooks/useExploreNavigation.ts",
"hooks/useFollowRequests.ts",
"hooks/useItemDetail.ts",
"hooks/useMessageRooms.ts",
"hooks/useNav.ts",
"hooks/useProfile.ts",
"hooks/useProfileSettings.ts",
"hooks/useTimeline.ts",
"lib/categories.ts",
"lib/constants.ts",
"lib/notifications.ts"
] : [];

const jaRegex = /[ぁ-んァ-ン一-龥]/;
let extracted = new Set();

files.forEach(file => {
    const code = fs.readFileSync(file, 'utf-8');
    const sourceFile = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true);

    function visit(node) {
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
            if (jaRegex.test(node.text)) {
                extracted.add(node.text);
            }
        } else if (ts.isJsxText(node)) {
            const text = node.getText();
            if (jaRegex.test(text)) {
                extracted.add(text.trim());
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);
});

fs.writeFileSync('extracted.json', JSON.stringify(Array.from(extracted), null, 2));
console.log('Done extracting.');
