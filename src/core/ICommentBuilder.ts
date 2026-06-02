export default interface ICommentBuilder
{
    Build(): Promise<string>
}