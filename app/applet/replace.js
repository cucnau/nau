import fs from 'fs';
import path from 'path';

// Resolving files relative to `/app/applet`
const readerPath = '../../src/pages/Reader.tsx';
const storyViewPath = '../../src/pages/StoryView.tsx';

function processFile(filePath, startMarker, endMarker, replacement) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  // Normalize line endings to LF for processing, then restore to CRLF at the end if desired.
  const originalCRLF = content.includes('\r\n');
  content = content.replace(/\r\n/g, '\n');

  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) {
    console.log(`Start marker not found in ${filePath}`);
    return;
  }

  const endIndex = content.indexOf(endMarker, startIndex);
  if (endIndex === -1) {
    console.log(`End marker not found in ${filePath}`);
    return;
  }

  const finalEndIndex = endIndex + endMarker.length;
  const newContent = content.slice(0, startIndex) + replacement + content.slice(finalEndIndex);
  
  fs.writeFileSync(filePath, originalCRLF ? newContent.replace(/\n/g, '\r\n') : newContent, 'utf8');
  console.log(`Successfully processed ${filePath}!`);
}

// 1. Process pComments in Reader.tsx
const pCommentsStart = `{pComments.length === 0 ? (`;
const pCommentsEnd = `pComments.map(c => (`;
const pCommentsReplacement = `{pComments.length === 0 ? (
                                            <div className="text-center italic text-sm opacity-50 py-2">Chưa có bình luận. Hãy là người đầu tiên!</div>
                                        ) : (
                                            pComments.map(c => (
                                                <ParagraphCommentNode
                                                   key={c.id}
                                                   comment={c}
                                                   comments={comments}
                                                   replyingToId={replyingToId}
                                                   setReplyingToId={setReplyingToId}
                                                   replyText={replyText}
                                                   setReplyText={setReplyText}
                                                   submittingReply={submittingReply}
                                                   handleSendReply={handleSendReply}
                                                   getTitleColor={getTitleColor}
                                                   isLoggedIn={isLoggedIn}
                                                   isDark={isDark}
                                                />
                                            ))
                                        )}`;

processFile(
  readerPath,
  pCommentsStart,
  // Match till the end of pComments.map loop
  `                                            ))\n                                        )}`,
  pCommentsReplacement
);

// 2. Process chapterComments in Reader.tsx (since we already modified the beginning, let's fix it cleanly to use ChapterCommentNode)
const chapterCommentsStart = `{chapterComments.length === 0 ? (`;
const chapterCommentsEnd = `chapterComments.map(c => { return <ChapterCommentNode key={c.id} comment={c} comments={comments} replyingToId={replyingToId} setReplyingToId={setReplyingToId} replyText={replyText} setReplyText={setReplyText} submittingReply={submittingReply} handleSendReply={handleSendReply} getTitleColor={getTitleColor} isLoggedIn={isLoggedIn} isDark={isDark} />; if (false) { return (`;
const chapterCommentsReplacement = `{chapterComments.length === 0 ? (
                        <p className="text-center italic opacity-50">Chưa có bình luận nào cho chương này.</p>
                    ) : (
                        chapterComments.map(c => (
                            <ChapterCommentNode
                               key={c.id}
                               comment={c}
                               comments={comments}
                               replyingToId={replyingToId}
                               setReplyingToId={setReplyingToId}
                               replyText={replyText}
                               setReplyText={setReplyText}
                               submittingReply={submittingReply}
                               handleSendReply={handleSendReply}
                               getTitleColor={getTitleColor}
                               isLoggedIn={isLoggedIn}
                               isDark={isDark}
                            />
                        ))
                    )}`;

processFile(
  readerPath,
  chapterCommentsStart,
  `                            </div>\n                        ))\n                    )}`,
  chapterCommentsReplacement
);
